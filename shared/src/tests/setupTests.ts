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
			return { closePeerConnection: vi.fn() };
		}),
		// eslint-disable-next-line object-shorthand
		VideoScreenInConnection: vi.fn().mockImplementation(function () {
			return { closePeerConnection: vi.fn() };
		}),
		// eslint-disable-next-line object-shorthand
		VideoOutConnection: vi.fn().mockImplementation(function () {
			return { closePeerConnection: vi.fn() };
		}),
		// eslint-disable-next-line object-shorthand
		ScreenOutConnection: vi.fn().mockImplementation(function () {
			return { closePeerConnection: vi.fn() };
		}),
		useStore,
		sendCustomEvent: vi.fn(),
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
