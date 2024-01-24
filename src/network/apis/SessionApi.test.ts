/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import sessionApi from './SessionApi';
import useStore from '../../store/Store';
import { createMockCapabilityList } from '../../tests/createMock';
import { fetchResponse } from '../../tests/mocks/global';

describe('Session API', () => {
	test('getToken is called correctly', async () => {
		// Send getToken request
		fetchResponse.mockResolvedValueOnce({ token: 'test-token' });
		await sessionApi.getToken();

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/auth/token`, {
			method: 'GET',
			headers,
			body: undefined
		});
	});

	test('getCapabilities is called correctly', async () => {
		// Send getCapabilities request
		const capabilityList = createMockCapabilityList();
		fetchResponse.mockResolvedValueOnce(capabilityList);
		await sessionApi.getCapabilities();

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/capabilities`, {
			method: 'GET',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.session.capabilities).toEqual(capabilityList);
	});
});
