/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom/extend-expect';
import { act, configure } from '@testing-library/react';
import failOnConsole from 'jest-fail-on-console';

import useStore from './src/store/Store';
import { xmppClient } from './src/tests/mockedXmppClient';

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

const noResultProvided = 'no result provided';

const mockedGetUserMediaPromise: jest.Mock = jest.fn(() => ({
	getTracks: jest.fn(() => ({ forEach: jest.fn() })),
	getAudioTracks: jest.fn(() => ({ forEach: jest.fn() }))
}));
const getUserMediaPromise = jest.fn(
	async () =>
		new Promise<void>((resolve, reject) => {
			const result = mockedGetUserMediaPromise();
			result ? resolve(result) : reject(new Error(noResultProvided));
		})
);

export const intersectionObserverMockObserve = jest.fn();
export const intersectionObserverMockDisconnect = jest.fn();

export const mockedEnumerateDevicesPromise: jest.Mock = jest.fn(() => [
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
const enumerateDevicesPromise = jest.fn(
	async () =>
		new Promise<void>((resolve, reject) => {
			const result = mockedEnumerateDevicesPromise();
			result ? resolve(result) : reject(new Error(noResultProvided));
		})
);

beforeEach(() => {
	jest.useFakeTimers();
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448
	useStore.getState().setXmppClient(xmppClient);
});

beforeAll(() => {
	jest.setTimeout(30000);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	jest.retryTimes(2, { logErrorsBeforeRetry: true });

	// define browser objects non available in jest
	// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom

	// MOCK NAVIGATOR MEDIADEVICES
	Object.defineProperty(global.navigator, 'mediaDevices', {
		value: {
			getUserMedia: getUserMediaPromise,
			enumerateDevices: enumerateDevicesPromise,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn()
		}
	});

	// MOCK HTMLMEDIAELEMENT.PROTOTYPE
	// this is a statement to use when there's a video tag with the muted prop
	Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
		set: jest.fn()
	});

	Object.defineProperty(window, 'RTCPeerConnection', {
		value: jest.fn(function RTCPeerConnectionMock() {
			return {
				addTrack: jest.fn()
			};
		})
	});

	Object.defineProperty(window, 'AudioContext', {
		writable: true,
		value: jest.fn(function AudioContextMock() {
			return {
				createOscillator: (): any => ({
					connect: () => ({
						stream: {
							getAudioTracks: () => [MediaStream]
						}
					}),
					start: jest.fn()
				}),
				createMediaStreamDestination: jest.fn()
			};
		})
	});

	Object.defineProperty(window, 'MediaStream', {
		writable: true,
		value: jest.fn(function MediaStreamMock() {
			return {
				stream: (): any => ({
					getAudioTracks: jest.fn(),
					addTrack: jest.fn()
				}),
				getAudioTracks: (): any[] => [MediaStream],
				addTrack: jest.fn()
			};
		})
	});
	Object.defineProperty(window, 'open', {
		value: jest.fn()
	});

	// This mock makes uuid/v4 to always generate the same uuid "00000000-0000-4000-8000-000000000000"
	Object.defineProperty(window, 'crypto', {
		value: {
			getRandomValues: (arr: string[]) => {
				const byteValues = new Uint8Array(arr.length);
				byteValues.fill(0);
				return byteValues;
			}
		}
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

	// mock a simplified Intersection Observer
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

	Object.defineProperty(window, 'ResizeObserver', {
		writable: true,
		value: jest.fn().mockImplementation(() => ({
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: jest.fn()
		}))
	});

	Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
		writable: true,
		value: jest.fn()
	});

	let mockedStore: Record<string, unknown> = {};
	Object.defineProperty(window, 'localStorage', {
		writable: true,
		value: {
			getItem: jest.fn().mockImplementation((key) => mockedStore[key] || null),
			setItem: jest.fn().mockImplementation((key, value) => {
				mockedStore[key] = value.toString();
			}),
			removeItem: jest.fn().mockImplementation((key) => {
				delete mockedStore[key];
			}),
			clear() {
				mockedStore = {};
			}
		}
	});

	window.resizeTo = function resizeTo(width, height): void {
		Object.assign(this, {
			innerWidth: width,
			innerHeight: height,
			outerWidth: width,
			outerHeight: height
		}).dispatchEvent(new this.Event('resize'));
	};

	Element.prototype.scrollTo = jest.fn();
});

afterEach(() => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
	jest.restoreAllMocks();
	act(() => {
		window.resizeTo(1024, 768);
	});
});
