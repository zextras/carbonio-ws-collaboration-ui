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

// TODO setup mocks in the tests that need them ?
vi.mock('@zextras/carbonio-files-ui');
vi.mock('@zextras/carbonio-shell-ui');
vi.mock('@zextras/carbonio-ui-preview');
vi.mock('@zextras/carbonio-ui-soap-lib');
vi.mock('darkreader');
vi.mock('react-router-dom');
vi.mock('zustand');
import '@mocks/FetchUtils';

beforeAll(() => {
	vi.useFakeTimers({
		shouldAdvanceTime: true
	});
});

afterAll(() => {
	vi.useRealTimers();
});

beforeAll(() => {
	vi.mock('@zextras/carbonio-shell-ui');
});

export const mockIntersectionObserverObserve = vi.fn();
export const mockIntersectionObserverDisconnect = vi.fn();
export const mockPlayAudio = vi.fn();
beforeEach(() => {
	vi.clearAllMocks();

	Object.defineProperty(window, 'location', {
		value: {
			href: 'https://localhost/carbonio/chats',
			pathname: 'https://localhost/carbonio/chats',
			replace: vi.fn(),
			includes: vi.fn(),
			assign: vi.fn()
		},
		writable: true
	});

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

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null
		}))
	});

	Object.defineProperty(window, 'RTCPeerConnection', {
		writable: true,
		value: vi.fn(function xRTCPeerConnectionMock() {
			return {
				addTrack: vi.fn(),
				createAnswer: vi.fn(() => Promise.resolve({ sdp: '', type: 'answer' })),
				setRemoteDescription: vi.fn(() => Promise.resolve()),
				setLocalDescription: vi.fn(() => Promise.resolve())
			};
		})
	});

	Object.defineProperty(window, 'RTCSessionDescription', {
		writable: true,
		value: vi.fn(function RTCPeerSessionDescriptionMock() {
			return {
				sdp: 'sdp',
				type: 'offer'
			};
		})
	});

	Object.defineProperty(window, 'AudioContext', {
		writable: true,
		value: vi.fn(function AudioContextMock() {
			return {
				createOscillator: (): any => ({
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
				}),
				createMediaStreamDestination: vi.fn()
			};
		})
	});

	Object.defineProperty(window, 'MediaStream', {
		writable: true,
		value: vi.fn(function MediaStreamMock() {
			return {
				stream: (): any => ({
					getAudioTracks: vi.fn(),
					getVideoTracks: vi.fn(),
					addTrack: vi.fn()
				}),
				getAudioTracks: (): any[] => [MediaStream],
				getVideoTracks: (): any[] => [MediaStream],
				addTrack: vi.fn()
			};
		})
	});

	const mockedDevicesList = vi.fn(() => [
		{
			deviceId: 'audioDefault',
			kind: 'audioinput',
			label: 'Audio Default',
			groupId: 'default'
		},
		{
			deviceId: 'audioDevice1',
			kind: 'audioinput',
			label: 'Audio Device 1',
			groupId: 'device1'
		},
		{
			deviceId: 'audioDevice2',
			kind: 'audioinput',
			label: 'Audio Device 2',
			groupId: 'device2'
		},
		{
			deviceId: 'videoDefault',
			kind: 'videoinput',
			label: 'Video Default',
			groupId: 'default'
		},
		{
			deviceId: 'videoDevice 1',
			kind: 'videoinput',
			label: 'Video Device 1',
			groupId: 'device1'
		},
		{
			deviceId: 'videoDevice 2',
			kind: 'videoinput',
			label: 'Video Device 2',
			groupId: 'device2'
		}
	]);
	Object.defineProperty(navigator, 'mediaDevices', {
		value: {
			getUserMedia: () =>
				Promise.resolve({
					getTracks: vi.fn(() => ({ forEach: vi.fn() })),
					getAudioTracks: vi.fn(() => ({ forEach: vi.fn() })),
					getVideoTracks: vi.fn(() => ({ forEach: vi.fn() })),
					addTrack: vi.fn()
				}),
			enumerateDevices: () => Promise.resolve(mockedDevicesList()),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		},
		writable: true
	});

	Object.defineProperty(document.documentElement, 'requestFullscreen', {
		writable: true,
		value: vi.fn()
	});

	Object.defineProperty(global, 'Audio', {
		writable: true,
		value: vi.fn(function AudioMock() {
			return {
				play: mockPlayAudio
			};
		})
	});
	
	Object.defineProperty(global.URL, 'createObjectURL', {
		writable: true,
		configurable: true,
		value: vi.fn()
	});

	// Object.defineProperty(window, 'ResizeObserver', {
	// 	writable: true,
	// 	value: vi.fn().mockImplementation(() => ({
	// 		observe: vi.fn(),
	// 		unobserve: vi.fn(),
	// 		disconnect: vi.fn()
	// 	}))
	// });
	//
	// global.Audio = vi.fn().mockImplementation(() => ({
	// 	play: mockPlayAudio
	// }));
	//
	// Object.defineProperty(window.crypto, 'randomUUID', {
	// 	writable: true,
	// 	value: vi.fn(() => Math.random().toString())
	// });
});

afterAll(() => {});
afterEach(() => {
	// act(() => {
	// 	window.resizeTo(1024, 768);
	// });
});
