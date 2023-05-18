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
	jest.useRealTimers();
	jest.restoreAllMocks();
	act(() => {
		window.resizeTo(1024, 768);
	});
});
