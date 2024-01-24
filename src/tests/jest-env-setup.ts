/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import '@testing-library/jest-dom/extend-expect';
import { act, configure } from '@testing-library/react';
import failOnConsole from 'jest-fail-on-console';

import { xmppClient } from './mockedXmppClient';
import useStore from '../store/Store';

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
});

afterEach(() => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
	jest.restoreAllMocks();
	act(() => {
		window.resizeTo(1024, 768);
	});
});
