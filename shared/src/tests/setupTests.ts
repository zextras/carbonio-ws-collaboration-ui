/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';

import useStore from './testStore';
import { configureSharedCode } from '../config';

export const mockNotify = vi.fn();

vi.mock('@zextras/carbonio-shell-ui', () => ({
	IS_FOCUS_MODE: false,
	getNotificationManager: (): any => ({ notify: mockNotify })
}));

const initialState = useStore.getState();

export const mockPlayAudio = vi.fn();

Object.defineProperty(globalThis, 'MediaStream', {
	configurable: true,
	writable: true,
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

Object.defineProperty(globalThis, 'RTCPeerConnection', {
	configurable: true,
	writable: true,
	value: vi.fn(function RTCPeerConnectionMock() {
		return {
			addTrack: vi.fn(),
			createAnswer: vi.fn(() => Promise.resolve({ sdp: '', type: 'answer' })),
			setRemoteDescription: vi.fn(() => Promise.resolve()),
			setLocalDescription: vi.fn(() => Promise.resolve())
		};
	})
});

Object.defineProperty(globalThis, 'RTCSessionDescription', {
	configurable: true,
	writable: true,
	value: vi.fn(function RTCPeerSessionDescriptionMock() {
		return {
			sdp: 'sdp',
			type: 'offer'
		};
	})
});

export const mockFetchAPI = vi.fn();
export const mockSendFileFetchAPI = vi.fn();
export const mockUploadFileFetchAPI = vi.fn();
export const mockDisplayNotification = vi.fn();
export const mockSendCustomEvent = vi.fn();
export const mockClearAuthCookies = vi.fn();
export const mockGetForwardedMessagePayload = vi.fn(() => Promise.resolve(''));

beforeAll(() => {
	configureSharedCode({
		useStore,
		sendCustomEvent: mockSendCustomEvent,
		getStream: vi.fn(() => Promise.resolve(new MediaStream())),
		createSilentAudioStream: vi.fn(() => new MediaStream()),
		playRemoteAudioStream: vi.fn(),
		clearAuthCookies: mockClearAuthCookies,
		xmppClient: {
			setOnline: vi.fn(),
			readMessage: vi.fn(),
			getForwardedMessagePayload: mockGetForwardedMessagePayload
		},
		playAudio: mockPlayAudio,
		displayNotification: mockDisplayNotification,
		fetchAPI: mockFetchAPI,
		sendFileFetchAPI: mockSendFileFetchAPI,
		uploadFileFetchAPI: mockUploadFileFetchAPI
	});
});

beforeAll(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterAll(() => {
	vi.useRealTimers();
});

beforeEach(() => {
	useStore.setState(initialState, true);
	mockFetchAPI.mockReset().mockResolvedValue({});
});
