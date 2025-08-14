/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import App from './app';
import { MEETINGS_PATH } from './constants/appConstants';
import InfoApi from './network/apis/InfoApi';
import { setup } from './tests/test-utils';

describe('App tests', () => {
	test('App is rendered when license is enabled', async () => {
		jest.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: true });
		jest.mocked(shell).IS_FOCUS_MODE = false;
		const addRoute = jest.spyOn(shell, 'addRoute');
		setup(<App />);
		await waitFor(() => {
			expect(addRoute).toBeCalled();
		});
	});

	test('App is not rendered when license is disabled', async () => {
		jest.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: false });
		const { container } = setup(<App />);
		await waitFor(() => {
			expect(container).toBeEmptyDOMElement();
		});
	});

	test('App is not rendered when there is an error on fetching license', async () => {
		jest.spyOn(InfoApi, 'getLicense').mockRejectedValueOnce({});
		const error = jest.spyOn(console, 'error').mockImplementation();
		const { container } = setup(<App />);
		await waitFor(() => {
			expect(error).toHaveBeenCalled();
		});
		expect(container).toBeEmptyDOMElement();
	});

	test('Redirect to login when license is disabled and we are in meeting path', async () => {
		jest.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: false });
		jest.mocked(shell).IS_FOCUS_MODE = true;
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}meetingId`;

		const assign = jest.spyOn(window.location, 'assign');
		setup(<App />);
		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
	});
});
