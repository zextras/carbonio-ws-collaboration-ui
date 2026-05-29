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

export const mockFetchAPI = vi.fn();
export const mockSendFileFetchAPI = vi.fn();
export const mockUploadFileFetchAPI = vi.fn();

beforeAll(() => {
	configureSharedCode({
		// eslint-disable-next-line object-shorthand
		BidirectionalConnectionAudioInOut: vi.fn().mockImplementation(function () {
			return {
				closePeerConnection: vi.fn(),
				handleRemoteAnswer: vi.fn(),
				updateLocalStreamTrack: vi.fn(),
				updateRemoteStreamAudio: vi.fn(),
				closeRtpSenderTrack: vi.fn()
			};
		}),
		// eslint-disable-next-line object-shorthand
		VideoScreenInConnection: vi.fn().mockImplementation(function () {
			return {
				closePeerConnection: vi.fn(),
				handleRemoteOffer: vi.fn(),
				handleParticipantsSubscribed: vi.fn(),
				removeStream: vi.fn(),
				subscriptionManager: {
					addSubscription: vi.fn(),
					removeSubscription: vi.fn(),
					deleteSubscription: vi.fn(),
					updateSubscription: vi.fn()
				}
			};
		}),
		// eslint-disable-next-line object-shorthand
		VideoOutConnection: vi.fn().mockImplementation(function () {
			return {
				closePeerConnection: vi.fn(),
				startVideo: vi.fn(),
				stopVideo: vi.fn(),
				handleRemoteAnswer: vi.fn(),
				updateLocalStreamTrack: vi.fn()
			};
		}),
		// eslint-disable-next-line object-shorthand
		ScreenOutConnection: vi.fn().mockImplementation(function () {
			return {
				closePeerConnection: vi.fn(),
				startScreenShare: vi.fn(),
				handleRemoteAnswer: vi.fn(),
				stopScreenShare: vi.fn()
			};
		}),
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
		}
	});
});

beforeEach(() => {
	useStore.setState(initialState, true);
	mockFetchAPI.mockReset().mockResolvedValue({});
});
