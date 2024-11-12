/* eslint-disable import/no-mutable-exports */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom';
import { act, configure } from '@testing-library/react';
import failOnConsole from 'jest-fail-on-console';

import XMPPClient from '../network/xmpp/XMPPClient';
import useStore from '../store/Store';
import * as FetchUtils from '../utils/FetchUtils';
import {
	intersectionObserverMockDisconnect,
	intersectionObserverMockObserve,
	mockedDevicesList,
	mockPlayAudio
} from './mocks/global';

export let spyOnFetch: jest.SpyInstance;

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

beforeEach(() => {
	useStore.getState().setXmppClient(new XMPPClient());
	spyOnFetch = jest.spyOn(FetchUtils, 'fetchAPI');
	spyOnFetch.mockImplementation(() => Promise.resolve(true));

	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: jest.fn().mockImplementation((callback, options) => ({
			thresholds: options.threshold,
			root: options.root,
			rootMargin: options.rootMargin,
			observe: intersectionObserverMockObserve,
			unobserve: jest.fn(),
			disconnect: intersectionObserverMockDisconnect
		}))
	});

	Object.defineProperty(window, 'AudioContext', {
		writable: true,
		value: jest.fn(() => ({
			createOscillator: (): any => ({
				connect: () => ({
					stream: {
						getAudioTracks: () => [MediaStream]
					}
				}),
				start: jest.fn()
			}),
			createMediaStreamDestination: jest.fn()
		}))
	});

	Object.defineProperty(window, 'ResizeObserver', {
		writable: true,
		value: jest.fn().mockImplementation(() => ({
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn()
		}))
	});

	global.Audio = jest.fn().mockImplementation(() => ({
		play: mockPlayAudio
	}));

	Object.defineProperty(window, 'MediaStream', {
		writable: true,
		value: jest.fn(() => ({
			stream: (): any => ({
				getAudioTracks: jest.fn(),
				getVideoTracks: jest.fn(),
				addTrack: jest.fn()
			}),
			getAudioTracks: (): any[] => [MediaStream],
			getVideoTracks: (): any[] => [MediaStream],
			addTrack: jest.fn()
		}))
	});

	Object.defineProperty(navigator, 'mediaDevices', {
		value: {
			getUserMedia: () =>
				Promise.resolve({
					getTracks: jest.fn(() => ({ forEach: jest.fn() })),
					getAudioTracks: jest.fn(() => ({ forEach: jest.fn() })),
					getVideoTracks: jest.fn(() => ({ forEach: jest.fn() })),
					addTrack: jest.fn()
				}),
			enumerateDevices: () => Promise.resolve(mockedDevicesList()),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn()
		},
		writable: true
	});

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(), // Deprecated
			removeListener: jest.fn(), // Deprecated
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn()
		}))
	});
});

afterEach(() => {
	act(() => {
		window.resizeTo(1024, 768);
	});
});
