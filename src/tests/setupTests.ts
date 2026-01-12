/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import failOnConsole from 'vitest-fail-on-console';

configure({
	asyncUtilTimeout: 2000
});

failOnConsole({
	shouldFailOnWarn: true,
	shouldFailOnError: true,
	silenceMessage: (errorMessage) =>
		// snackbar PropType error on Window type
		/Invalid prop `\w+`(\sof type `\w+`)? supplied to `(\w+\(\w+\))`/.test(errorMessage) ||
		// errors forced from the tests
		/Controlled error/gi.test(errorMessage)
});

// Global mocks
vi.mock('zustand');
vi.mock('@zextras/carbonio-shell-ui');
vi.mock('@zextras/carbonio-ui-preview');
vi.mock('darkreader');
vi.mock('react-router-dom');

Object.defineProperty(window, 'RTCPeerConnection', {
	value: vi.fn(function RTCPeerConnectionMock() {
		return {
			addTrack: vi.fn(),
			createAnswer: vi.fn(() => Promise.resolve({ sdp: '', type: 'answer' })),
			setRemoteDescription: vi.fn(() => Promise.resolve()),
			setLocalDescription: vi.fn(() => Promise.resolve())
		};
	})
});

Object.defineProperty(window, 'RTCSessionDescription', {
	value: vi.fn(function RTCPeerSessionDescriptionMock() {
		return {
			sdp: 'sdp',
			type: 'offer'
		};
	})
});

Object.defineProperty(window, 'Worker', {
	value: vi.fn(function Worker() {
		return {
			onmessage: vi.fn(),
			postMessage: vi.fn()
		};
	})
});

Object.defineProperty(window, 'ResizeObserver', {
	value: vi.fn(function ResizeObserverMock() {
		return {
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn()
		};
	})
});

Object.defineProperty(window, 'matchMedia', {
	value: vi.fn(function matchMediaMock(query) {
		return {
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
	})
});

Object.defineProperty(window, 'location', {
	value: {
		href: 'https://localhost/carbonio/chats',
		pathname: 'https://localhost/carbonio/chats',
		replace: vi.fn(),
		includes: vi.fn(),
		assign: vi.fn()
	}
});

Object.defineProperty(window, 'AudioContext', {
	writable: true,
	value: vi.fn(function AudioContextMock() {
		return {
			createOscillator: vi.fn(() => ({
				connect: (): {
					stream: {
						getAudioTracks: () => {
							prototype: MediaStream;
							new (): MediaStream;
							new (stream: MediaStream): MediaStream;
							new (tracks: MediaStreamTrack[]): MediaStream;
						}[];
					};
				} => ({
					stream: {
						getAudioTracks: () => [MediaStream]
					}
				}),
				start: vi.fn()
			})),
			createMediaStreamDestination: vi.fn()
		};
	})
});

Object.defineProperty(window, 'MediaStream', {
	value: vi.fn(function MediaStreamMock() {
		return {
			stream: vi.fn(() => ({
				getAudioTracks: vi.fn(),
				getVideoTracks: vi.fn(),
				addTrack: vi.fn()
			})),
			getAudioTracks: vi.fn(() => [MediaStream]),
			getVideoTracks: vi.fn(() => [MediaStream]),
			addTrack: vi.fn()
		};
	})
});

Object.defineProperty(global, 'fetch', {
	value: vi.fn(() =>
		Promise.resolve({
			json: vi.fn(),
			blob: vi.fn(),
			ok: true,
			headers: { get: vi.fn() }
		})
	)
});

Object.defineProperty(navigator, 'mediaDevices', {
	value: {
		getUserMedia: () =>
			Promise.resolve({
				getTracks: vi.fn(() => ({ forEach: vi.fn() })),
				getAudioTracks: vi.fn(() => ({ forEach: vi.fn() })),
				getVideoTracks: vi.fn(() => ({ forEach: vi.fn() })),
				addTrack: vi.fn()
			}),
		enumerateDevices: () =>
			Promise.resolve([
				{
					deviceId: 'audioDefault',
					kind: 'audioinput',
					label: 'Audio Default',
					groupId: 'default'
				},
				{
					deviceId: 'videoDefault',
					kind: 'videoinput',
					label: 'Video Default',
					groupId: 'default'
				}
			]),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	}
});

beforeAll(() => {
	vi.useFakeTimers({
		shouldAdvanceTime: true
	});
});

export const mockIntersectionObserverObserve = vi.fn();
export const mockIntersectionObserverDisconnect = vi.fn();

export const mockPlayAudio = vi.fn(() => Promise.resolve());

beforeEach(() => {
	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: vi.fn(function intersectionObserverMock(
			callback: IntersectionObserverCallback,
			options: IntersectionObserverInit
		) {
			return {
				thresholds: options.threshold,
				root: options.root,
				rootMargin: options.rootMargin,
				observe: mockIntersectionObserverObserve,
				unobserve: (): undefined => undefined,
				disconnect: mockIntersectionObserverDisconnect
			};
		})
	});

	Object.defineProperty(global, 'Audio', {
		writable: true,
		value: vi.fn(function AudioMock() {
			return {
				play: mockPlayAudio
			};
		})
	});
});

afterAll(() => {
	vi.useRealTimers();
});

afterEach(() => {
	vi.clearAllTimers();
});
