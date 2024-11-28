/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import sessionApi from './SessionApi';
import useStore from '../../store/Store';
import { createMockCapabilityList } from '../../tests/createMock';
import { spyOnFetch } from '../../tests/jest-env-setup';

describe('Session API', () => {
	test('getToken is called correctly', async () => {
		// Send getToken request
		await sessionApi.getToken();

		// Check if fetch is called with the correct parameters
		expect(spyOnFetch).toHaveBeenCalledTimes(1);
		expect(spyOnFetch).toHaveBeenCalledWith(`auth/token`, 'GET');
	});

	test('getCapabilities is called correctly', async () => {
		// Send getCapabilities request
		const capabilityList = createMockCapabilityList();
		spyOnFetch.mockResolvedValue(capabilityList);
		await sessionApi.getCapabilities();

		// Check if fetch is called with the correct parameters
		expect(spyOnFetch).toHaveBeenCalledTimes(1);
		expect(spyOnFetch).toHaveBeenCalledWith(`users/capabilities`, 'GET');

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.session.capabilities).toEqual(capabilityList);
	});
});
