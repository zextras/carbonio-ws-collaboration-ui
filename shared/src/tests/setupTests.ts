/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';

import useStore from './testStore';
import { configureSharedCode } from '../config';

const initialState = useStore.getState();

export const mockPlayAudio = vi.fn(() => Promise.resolve());

Object.defineProperty(window, 'location', {
	value: {
		href: 'https://localhost/carbonio/chats',
		pathname: 'https://localhost/carbonio/chats',
		replace: vi.fn(),
		includes: vi.fn(),
		assign: vi.fn()
	}
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

Object.defineProperty(global, 'Audio', {
	writable: true,
	value: vi.fn(function AudioMock() {
		return {
			play: mockPlayAudio
		};
	})
});

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

export const mockFetchAPI = vi.fn();
export const mockSendFileFetchAPI = vi.fn();
export const mockUploadFileFetchAPI = vi.fn();
export const mockDisplayWaitingListNotification = vi.fn();

beforeAll(() => {
	configureSharedCode({
		useStore,
		sendCustomEvent: (event) => {
			window.dispatchEvent(new CustomEvent(event.name, { detail: event.data }));
		},
		fetchAPI: mockFetchAPI,
		sendFileFetchAPI: mockSendFileFetchAPI,
		uploadFileFetchAPI: mockUploadFileFetchAPI,
		BrowserUtils: {
			clearAuthCookies: (): void => {
				document.cookie = `ZM_AUTH_TOKEN=; path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
				document.cookie = `ZX_AUTH_TOKEN=; path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			}
		},
		xmppClient: {
			setOnline: vi.fn(),
			readMessage: vi.fn(),
			requestMessageToForward: vi.fn()
		},
		HistoryAccumulator: {
			getNextId: vi.fn(),
			getForwardedMessage: vi.fn()
		},
		sendAudioFeedback: mockPlayAudio,
		displayWaitingListNotification: mockDisplayWaitingListNotification,
		UserMediaManager: {
			CONSTRAINT_ASPECT_RATIO: { aspectRatio: 1.7777 },
			enumerateDevices: vi.fn(),
			getAudioStream: vi.fn(() => Promise.resolve(new MediaStream())),
			getVideoStream: vi.fn(() => Promise.resolve(new MediaStream())),
			getFrontCameraStream: vi.fn(() => Promise.resolve(new MediaStream())),
			getAudioAndVideo: vi.fn(() => Promise.resolve(new MediaStream())),
			getScreenStream: vi.fn(() => Promise.resolve(new MediaStream()))
		}
	});
});

beforeEach(() => {
	useStore.setState(initialState, true);
	mockFetchAPI.mockReset().mockResolvedValue({});
});
