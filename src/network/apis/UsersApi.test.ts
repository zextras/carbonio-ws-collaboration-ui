/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { size } from 'lodash';
import * as uuid from 'uuid';

import usersApi from './UsersApi';
import useStore from '../../store/Store';
import { createMockCapabilityList, createMockUser } from '../../tests/createMock';
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

	test('changeUserPicture is called correctly', async () => {
		// Send changeUserPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await usersApi.changeUserPicture(user.id, testFile);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('fileName', '\\u0069\\u006d\\u0061\\u0067\\u0065\\u002e\\u0070\\u006e\\u0067'); // Unicode of 'image.png'
		headers.append('mimeType', testFile.type);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}/picture`, {
			method: 'PUT',
			headers,
			body: new ArrayBuffer(0)
		});
	});

	test('changeUserPicture is called with a too large file', async () => {
		// Set maxUserImageSizeInKb to 512kb
		const store = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ maxUserImageSizeInKb: 512 }));
		// Send changeUserPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		Object.defineProperty(testFile, 'size', { value: 1024 * 1024 + 1 });

		expect(usersApi.changeUserPicture(user.id, testFile)).rejects.toThrowError('File too large');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	test('deleteUserPicture is called correctly', async () => {
		// Send deleteUserPicture request
		await usersApi.deleteUserPicture(user.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}/picture`, {
			headers,
			method: 'DELETE',
			body: undefined
		});
	});
});
