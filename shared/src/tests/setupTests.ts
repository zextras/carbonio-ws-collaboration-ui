/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';

import useStore from './testStore';
import { configureSharedCode } from '../config';

const initialState = useStore.getState();

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
		sendCustomEvent: vi.fn()
	});
});

beforeEach(() => {
	useStore.setState(initialState, true);
});
