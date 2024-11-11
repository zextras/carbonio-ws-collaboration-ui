/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { size } from 'lodash';
import * as uuid from 'uuid';

import usersApi from './UsersApi';
import useStore from '../../store/Store';
import { createMockUser } from '../../tests/createMock';
import { fetchResponse } from '../../tests/mocks/global';
import { UserBe } from '../../types/network/models/userBeTypes';

const contentType = 'Content-Type';
const applicationJson = 'application/json';

const user: UserBe = createMockUser({ id: uuid.v6() });
const user2: UserBe = createMockUser({ id: uuid.v6() });

describe('Users API', () => {
	test('getUser is called correctly', async () => {
		// Send getUser request
		fetchResponse.mockResolvedValueOnce(user);
		await usersApi.getUser(user.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}`, {
			method: 'GET',
			headers,
			body: undefined
		});

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.users[user.id]).toEqual(user);
	});

	test('getUsers is called correctly', async () => {
		// Send getUser request
		fetchResponse.mockResolvedValueOnce([user, user2]);
		await usersApi.getUsers([user.id, user2.id]);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/users?userIds=${user.id}&userIds=${user2.id}`,
			{
				method: 'GET',
				headers,
				body: undefined
			}
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(size(store.users)).toBe(2);
		expect(store.users[user.id]).toEqual(user);
	});

	test('getURLUserPicture is called correctly', () => {
		const user = createMockUser({ id: 'userId' });
		const url = usersApi.getURLUserPicture(user.id);
		expect(url).toEqual(`http://localhost/services/chats/users/userId/picture`);
	});

	test('getUserPicture is called correctly', async () => {
		// Send getUserPicture request
		await usersApi.getUserPicture(user.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}/picture`, {
			headers,
			method: 'GET',
			body: undefined
		});
	});
});
