/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { fetchResponse } from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockCapabilityList, createMockUser } from '../../tests/createMock';
import { UserBe } from '../../types/network/models/userBeTypes';
import usersApi from './UsersApi';

const user: UserBe = createMockUser();

describe('Users API', () => {
	test('getUser is called correctly', async () => {
		// Send getUser request
		fetchResponse.mockResolvedValueOnce(user);
		await usersApi.getUser(user.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

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

	test('getUserPicture is called correctly', async () => {
		// Send getUserPicture request
		await usersApi.getUserPicture(user.id);

		// Set appropriate headers
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

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
		headers.append('fileName', 'aW1hZ2UucG5n'); // Base64 of 'image.png'
		headers.append('mimeType', testFile.type);

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}/picture`, {
			method: 'PUT',
			headers,
			body: new ArrayBuffer(0)
		});
	});

	test('changeUserPicture is called with a file too large', async () => {
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
		headers.append('Content-Type', 'application/json');

		// Check if fetch is called with the correct parameters
		expect(global.fetch).toHaveBeenCalledWith(`/services/chats/users/${user.id}/picture`, {
			headers,
			method: 'DELETE',
			body: undefined
		});
	});
});
