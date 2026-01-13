/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';

import { MicTestButton } from './MicTestButton';
import { screen, setup } from '../../../tests/test-utils';

describe('MicTestButton', () => {
	let mockStream: MediaStream;
	let mockMediaRecorder: {
		start: MockInstance;
		stop: MockInstance;
		ondataavailable: ((event: { data: Blob }) => void) | null;
		onstop: (() => void) | null;
		state: string;
	};
	let mockAudioElement: {
		play: MockInstance;
		pause: MockInstance;
		onloadedmetadata: (() => void) | null;
		onended: (() => void) | null;
		onerror: ((error: unknown) => void) | null;
		src: string;
	};
	let originalAudioContext: typeof window.AudioContext;

	beforeEach(() => {
		mockStream = {
			getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
		} as unknown as MediaStream;

		// Mock MediaRecorder
		mockMediaRecorder = {
			start: vi.fn().mockImplementation(function (this: typeof mockMediaRecorder) {
				this.state = 'recording';
			}),
			stop: vi.fn().mockImplementation(function (this: typeof mockMediaRecorder) {
				this.state = 'inactive';
				// Call onstop asynchronously to simulate real behavior
				setTimeout(() => {
					if (this.onstop) {
						this.onstop();
					}
				}, 0);
			}),
			ondataavailable: null,
			onstop: null,
			state: 'inactive'
		};

		vi.stubGlobal('MediaRecorder', function MediaRecorderMock() {
			mockMediaRecorder.state = 'inactive';
			return mockMediaRecorder;
		});

		// Mock Audio element
		mockAudioElement = {
			play: vi.fn().mockResolvedValue(undefined),
			pause: vi.fn(),
			onloadedmetadata: null,
			onended: null,
			onerror: null,
			src: ''
		};

		// Save original AudioContext and override it
		originalAudioContext = window.AudioContext;
		window.AudioContext = function AudioContextMock() {
			return {
				decodeAudioData: vi.fn().mockResolvedValue({
					getChannelData: vi.fn().mockReturnValue(new Float32Array([0.1, 0.2, 0.1, 0.2]))
				}),
				close: vi.fn().mockResolvedValue(undefined)
			};
		} as unknown as typeof AudioContext;

		// Override Audio global (already writable from setupTests.ts)
		global.Audio = function AudioMock() {
			// Trigger onloadedmetadata immediately after creation for testing purposes
			setTimeout(() => {
				if (mockAudioElement.onloadedmetadata) {
					mockAudioElement.onloadedmetadata();
				}
			}, 0);
			return mockAudioElement;
		} as unknown as typeof Audio;

		// Mock URL.createObjectURL and revokeObjectURL
		vi.stubGlobal('URL', {
			...URL,
			createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
			revokeObjectURL: vi.fn()
		});

		// Mock Blob with arrayBuffer method
		const OriginalBlob = global.Blob;
		vi.stubGlobal('Blob', function BlobMock(parts?: BlobPart[], options?: BlobPropertyBag) {
			const blob = new OriginalBlob(parts, options);
			// Add arrayBuffer method that returns a mock ArrayBuffer
			(blob as Blob & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = vi
				.fn()
				.mockResolvedValue(new ArrayBuffer(8));
			return blob;
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
		// Restore original AudioContext
		window.AudioContext = originalAudioContext;
	});

	test('renders the button with the correct initial label', () => {
		setup(<MicTestButton stream={mockStream} />);
		expect(screen.getByRole('button', { name: /start microphone test/i })).toBeInTheDocument();
	});

	test('disables the button when the disabled prop is true', () => {
		setup(<MicTestButton stream={mockStream} disabled />);
		const button = screen.getByRole('button', { name: /start microphone test/i });
		expect(button).toBeDisabled();
	});

	test('starts recording when the button is clicked', async () => {
		const { user } = setup(<MicTestButton stream={mockStream} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		await waitFor(() => {
			expect(screen.getByText(/recording your voice/i)).toBeInTheDocument();
		});
	});

	test('stops recording after the specified duration', async () => {
		const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={2000} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		await waitFor(() => {
			expect(screen.getByText(/recording your voice/i)).toBeInTheDocument();
		});

		// Advance timers to trigger the recording stop
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});

		await waitFor(() => {
			expect(screen.getByText(/playing back/i)).toBeInTheDocument();
		});
	});

	test('shows an error message if no audio is detected', async () => {
		// Override AudioContext to return low RMS values (below threshold)
		window.AudioContext = function AudioContextMock() {
			return {
				decodeAudioData: vi.fn().mockResolvedValue({
					getChannelData: vi.fn().mockReturnValue(new Float32Array([0.001, 0.001, 0.001, 0.001]))
				}),
				close: vi.fn().mockResolvedValue(undefined)
			};
		} as unknown as typeof AudioContext;

		const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={2000} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// Advance timers to trigger the recording stop
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});

		await waitFor(() => {
			expect(
				screen.getByText(/no sound detected. speak during recording or check your microphone/i)
			).toBeInTheDocument();
		});
	});

	test('shows a success message if audio is detected', async () => {
		// AudioContext is already mocked to return values above threshold
		const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={2000} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// Advance timers to trigger the recording stop
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});

		await waitFor(() => {
			expect(screen.getByText(/microphone is working correctly/i)).toBeInTheDocument();
		});
	});

	test('should not start recording when disabled', async () => {
		const { user } = setup(<MicTestButton stream={mockStream} disabled />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// MediaRecorder should not have been called
		expect(mockMediaRecorder.start).not.toHaveBeenCalled();
		// Should still show the initial button
		expect(screen.getByRole('button', { name: /start microphone test/i })).toBeInTheDocument();
	});

	test('should call MediaRecorder start when button is clicked', async () => {
		const { user } = setup(<MicTestButton stream={mockStream} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		expect(mockMediaRecorder.start).toHaveBeenCalled();
	});

	test('should return to ready state after playback ends', async () => {
		const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={2000} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// Advance timers to trigger the recording stop and playback
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});

		await waitFor(() => {
			expect(screen.getByText(/playing back/i)).toBeInTheDocument();
		});

		// Simulate playback ended
		await act(async () => {
			if (mockAudioElement.onended) {
				mockAudioElement.onended();
			}
		});

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /start microphone test again/i })
			).toBeInTheDocument();
		});
	});

	test('should use custom recording duration', async () => {
		const customDuration = 1000;
		const { user } = setup(
			<MicTestButton stream={mockStream} recordingDuration={customDuration} />
		);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// After 500ms, recording should still be active
		await act(async () => {
			vi.advanceTimersByTime(500);
		});

		expect(mockMediaRecorder.stop).not.toHaveBeenCalled();

		// After the full duration, recording should stop
		await act(async () => {
			vi.advanceTimersByTime(600);
		});

		expect(mockMediaRecorder.stop).toHaveBeenCalled();
	});

	test('should not start recording when stream is null', async () => {
		const { user } = setup(<MicTestButton stream={null} />);
		const button = screen.getByRole('button', { name: /start microphone test/i });

		await user.click(button);

		// MediaRecorder should not have been called
		expect(mockMediaRecorder.start).not.toHaveBeenCalled();
	});
});
