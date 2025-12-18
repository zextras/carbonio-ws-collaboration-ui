/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import infoApi from './InfoApi';
import { mockFetchAPI } from '../../utils/__mocks__/FetchUtils';

vi.mock('../../utils/FetchUtils');

describe('Session API', () => {
	test('getLicense is called correctly', async () => {
		// Send getToken request
		await infoApi.getLicense();

		// Check if fetch is called with the correct parameters
		expect(mockFetchAPI).toHaveBeenCalledTimes(1);
		expect(mockFetchAPI).toHaveBeenCalledWith(`license`, 'GET');
	});

	test('getToken is called correctly', async () => {
		// Send getToken request
		await infoApi.getToken();

		// Check if fetch is called with the correct parameters
		expect(mockFetchAPI).toHaveBeenCalledTimes(1);
		expect(mockFetchAPI).toHaveBeenCalledWith(`auth/token`, 'GET');
	});
});
