/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import sessionApi from './SessionApi';
import { spyOnFetch } from '../../tests/jest-env-setup';

describe('Session API', () => {
	test('getToken is called correctly', async () => {
		// Send getToken request
		await sessionApi.getToken();

		// Check if fetch is called with the correct parameters
		expect(spyOnFetch).toHaveBeenCalledTimes(1);
		expect(spyOnFetch).toHaveBeenCalledWith(`auth/token`, 'GET');
	});
});
