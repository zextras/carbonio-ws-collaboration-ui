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
});

afterEach(() => {
	act(() => {
		window.resizeTo(1024, 768);
	});
});
