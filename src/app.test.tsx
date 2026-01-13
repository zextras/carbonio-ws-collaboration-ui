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
		Object.defineProperty(shell, 'IS_FOCUS_MODE', { value: true });
		vi.spyOn(shell, 'useIsCarbonioCE').mockReturnValueOnce(false);
		vi.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: true });
		const addRoute = vi.spyOn(shell, 'addRoute');
		setup(<App />);
		await waitFor(() => {
			expect(addRoute).toBeCalled();
		});
	});

	test('App is not rendered when license is disabled', async () => {
		vi.spyOn(shell, 'useIsCarbonioCE').mockReturnValueOnce(false);
		vi.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: false });
		const { container } = setup(<App />);
		await waitFor(() => {
			expect(container).toBeEmptyDOMElement();
		});
	});

	test('Redirect to login when license is disabled and we are in meeting path', async () => {
		Object.defineProperty(shell, 'IS_FOCUS_MODE', { value: true });
		vi.spyOn(shell, 'useIsCarbonioCE').mockReturnValueOnce(false);
		vi.spyOn(InfoApi, 'getLicense').mockResolvedValueOnce({ licensed: false });
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}meetingId`;

		const assign = vi.spyOn(window.location, 'assign');
		setup(<App />);
		await waitFor(() => {
			expect(assign).toHaveBeenCalled();
		});
	});

	test('App is rendered without license check on Carbonio CE', async () => {
		vi.spyOn(shell, 'useIsCarbonioCE').mockReturnValue(true);
		const getLicenseApi = vi.spyOn(InfoApi, 'getLicense');
		const addRoute = vi.spyOn(shell, 'addRoute');
		setup(<App />);
		await waitFor(() => {
			expect(addRoute).toBeCalled();
		});
		expect(getLicenseApi).not.toHaveBeenCalled();
	});
});
