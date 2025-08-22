/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import infoApi from './InfoApi';
import { spyOnFetch } from '../../tests/jest-env-setup';

describe('Session API', () => {
	test('getLicense is called correctly', async () => {
		// Send getToken request
		await infoApi.getLicense();

		// Check if fetch is called with the correct parameters
		expect(spyOnFetch).toHaveBeenCalledTimes(1);
		expect(spyOnFetch).toHaveBeenCalledWith(`license`, 'GET');
	});

	test('getToken is called correctly', async () => {
		// Send getToken request
		await infoApi.getToken();

		// Check if fetch is called with the correct parameters
		expect(spyOnFetch).toHaveBeenCalledTimes(1);
		expect(spyOnFetch).toHaveBeenCalledWith(`auth/token`, 'GET');
	});
});
