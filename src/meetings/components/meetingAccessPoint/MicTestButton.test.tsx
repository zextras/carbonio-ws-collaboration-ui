/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act, waitFor } from '@testing-library/react';

import { MicTestButton } from './MicTestButton';
import { setup } from '../../../tests/test-utils';

const mockMediaRecorderInstances: MockMediaRecorderType[] = [];
const mockAudioInstances: MockAudioType[] = [];

interface MockMediaRecorderType {
	stream: MediaStream;
	state: RecordingState;
	ondataavailable: ((event: BlobEvent) => void) | null;
	onstop: (() => void) | null;
	start: jest.Mock;
	stop: jest.Mock;
}

interface MockAudioType {
	src: string;
	onloadedmetadata: (() => void) | null;
	onended: (() => void) | null;
	onerror: ((error: unknown) => void) | null;
	play: jest.Mock;
	pause: jest.Mock;
}

const createMockMediaRecorder = (stream: MediaStream): MockMediaRecorderType => {
	const instance: MockMediaRecorderType = {
		stream,
		state: 'inactive',
		ondataavailable: null,
		onstop: null,
		start: jest.fn().mockImplementation(() => {
			instance.state = 'recording';
		}),
		stop: jest.fn().mockImplementation(() => {
			instance.state = 'inactive';
			setTimeout(() => {
				const mockBlob = {
					type: 'audio/webm',
					size: 100,
					arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100))
				} as unknown as Blob;
				instance.ondataavailable?.({ data: mockBlob } as BlobEvent);
				instance.onstop?.();
			}, 0);
		})
	};
	mockMediaRecorderInstances.push(instance);
	return instance;
};

const createMockAudio = (): MockAudioType => {
	const instance: MockAudioType = {
		src: '',
		onloadedmetadata: null,
		onended: null,
		onerror: null,
		play: jest.fn().mockResolvedValue(undefined),
		pause: jest.fn()
	};
	mockAudioInstances.push(instance);
	setTimeout(() => {
		instance.onloadedmetadata?.();
	}, 0);
	return instance;
};

const mockDecodeAudioData = jest.fn();
const mockClose = jest.fn();

const createMockAudioContext = (): { decodeAudioData: jest.Mock; close: jest.Mock } => ({
	decodeAudioData: mockDecodeAudioData,
	close: mockClose
});

const createMockStream = (): MediaStream =>
	({
		getTracks: jest.fn().mockReturnValue([]),
		getAudioTracks: jest.fn().mockReturnValue([{ enabled: true }]),
		getVideoTracks: jest.fn().mockReturnValue([]),
		active: true
	}) as unknown as MediaStream;

const clearMockInstances = (): void => {
	mockMediaRecorderInstances.length = 0;
	mockAudioInstances.length = 0;
};

describe('MicTestButton', () => {
	const OriginalBlob = global.Blob;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		clearMockInstances();

		global.Blob = jest.fn().mockImplementation((parts, options) => {
			const blob = new OriginalBlob(parts, options);
			return {
				...blob,
				type: options?.type || '',
				size: parts?.[0]?.size || 100,
				arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100))
			};
		}) as unknown as typeof Blob;

		global.MediaRecorder = jest
			.fn()
			.mockImplementation(createMockMediaRecorder) as unknown as typeof MediaRecorder;
		global.Audio = jest.fn().mockImplementation(createMockAudio) as unknown as typeof Audio;
		global.AudioContext = jest
			.fn()
			.mockImplementation(createMockAudioContext) as unknown as typeof AudioContext;
		global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = jest.fn();

		mockDecodeAudioData.mockResolvedValue({
			getChannelData: jest.fn().mockReturnValue(new Float32Array([0.5, 0.5, 0.5]))
		});
		mockClose.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await act(async () => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		global.Blob = OriginalBlob;
	});

	describe('Initial render', () => {
		test('should render button with correct initial label', () => {
			const mockStream = createMockStream();
			setup(<MicTestButton stream={mockStream} />);

			expect(screen.getByRole('button', { name: 'START MICROPHONE TEST' })).toBeInTheDocument();
		});

		test('should render disabled button when disabled prop is true', () => {
			const mockStream = createMockStream();
			setup(<MicTestButton stream={mockStream} disabled />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			expect(button).toBeDisabled();
		});
	});

	describe('Recording state', () => {
		test('should start recording when button is clicked with valid stream', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			expect(mockMediaRecorderInstances.length).toBe(1);
			expect(mockMediaRecorderInstances[0].start).toHaveBeenCalled();
		});

		test('should show recording UI when recording starts', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			expect(screen.getByText('RECORDING...')).toBeInTheDocument();
		});

		test('should not start recording when disabled', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} disabled />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			expect(mockMediaRecorderInstances.length).toBe(0);
		});

		test('should stop recording after duration expires', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			expect(mockMediaRecorderInstances[0].stop).not.toHaveBeenCalled();

			await act(async () => {
				jest.advanceTimersByTime(4100);
			});

			expect(mockMediaRecorderInstances[0].stop).toHaveBeenCalled();
		});
	});

	describe('Playing state', () => {
		test('should show playing UI after recording stops', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			// Stop recording and trigger onstop callback
			await act(async () => {
				jest.advanceTimersByTime(4100);
			});

			// Allow the setTimeout in stop() mock to execute (triggers onstop)
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			// Allow the audio onloadedmetadata callback (triggered by play())
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			await waitFor(() => {
				expect(screen.getByText('PLAYING RECORDING...')).toBeInTheDocument();
			});
		});

		test('should return to ready state after playback ends', async () => {
			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			// Stop recording
			await act(async () => {
				jest.advanceTimersByTime(4100);
			});

			// Allow onstop callback
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			// Allow audio to load
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			// Simulate playback ended
			await act(async () => {
				mockAudioInstances[0].onended?.();
			});

			expect(
				screen.getByRole('button', { name: 'START MICROPHONE TEST AGAIN' })
			).toBeInTheDocument();
		});
	});

	describe('Audio analysis and snackbar', () => {
		test('should show success snackbar when audio is detected', async () => {
			mockDecodeAudioData.mockResolvedValue({
				getChannelData: jest.fn().mockReturnValue(new Float32Array([0.5, 0.5, 0.5]))
			});

			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			// Stop recording
			await act(async () => {
				jest.advanceTimersByTime(4100);
			});

			// Allow onstop callback (which triggers analyzeAudioBlob)
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			// Wait for the async audio analysis to complete
			await waitFor(() => {
				expect(screen.getByText('Microphone is working correctly')).toBeInTheDocument();
			});
		});

		test('should show error snackbar when no audio is detected', async () => {
			// Mock audio analysis to return low RMS (no sound)
			mockDecodeAudioData.mockResolvedValue({
				getChannelData: jest.fn().mockReturnValue(new Float32Array([0.001, 0.001, 0.001]))
			});

			const mockStream = createMockStream();
			const { user } = setup(<MicTestButton stream={mockStream} recordingDuration={4000} />);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			// Stop recording
			await act(async () => {
				jest.advanceTimersByTime(4100);
			});

			// Allow onstop callback
			await act(async () => {
				jest.advanceTimersByTime(10);
			});

			await waitFor(() => {
				expect(
					screen.getByText('No sound detected. Speak during recording or check your microphone')
				).toBeInTheDocument();
			});
		});
	});

	describe('Custom recording duration', () => {
		test('should use custom recording duration', async () => {
			const customDuration = 2000;
			const mockStream = createMockStream();
			const { user } = setup(
				<MicTestButton stream={mockStream} recordingDuration={customDuration} />
			);

			const button = screen.getByRole('button', { name: /start microphone test/i });
			await user.click(button);

			await act(async () => {
				jest.advanceTimersByTime(1500);
			});

			expect(mockMediaRecorderInstances[0].stop).not.toHaveBeenCalled();

			await act(async () => {
				jest.advanceTimersByTime(600);
			});

			expect(mockMediaRecorderInstances[0].stop).toHaveBeenCalled();
		});
	});
});
