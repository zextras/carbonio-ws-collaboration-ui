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
import { spyOnFetch } from '../../tests/jest-env-setup';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { UserBe } from '../../types/network/models/userBeTypes';
import * as FetchUtils from '../../utils/FetchUtils';

const user: UserBe = createMockUser({ id: uuid.v6() });
const user2: UserBe = createMockUser({ id: uuid.v6() });

describe('Users API', () => {
	test('getUser is called correctly', async () => {
		// Send getUser request
		spyOnFetch.mockResolvedValueOnce(user);
		await usersApi.getUser(user.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`users/${user.id}`, RequestType.GET);
		// Check if store is correctly updated
		const store = useStore.getState();
		expect(store.users[user.id]).toEqual(user);
	});

	test('getUsers is called correctly', async () => {
		// Send getUser request
		spyOnFetch.mockResolvedValueOnce([user, user2]);
		await usersApi.getUsers([user.id, user2.id]);

		expect(spyOnFetch).toHaveBeenCalledWith(
			`users?userIds=${user.id}&userIds=${user2.id}`,
			RequestType.GET
		);

		// Check if store is correctly updated
		const store = useStore.getState();
		expect(size(store.users)).toBe(2);
		expect(store.users[user.id]).toEqual(user);
	});

	test('getURLUserPicture is called correctly', () => {
		const user = createMockUser({ id: 'userId' });
		const url = usersApi.getURLUserPicture(user.id);

		expect(url).toEqual('http://localhost/services/chats/users/userId/picture');
	});

	test('getUserPicture is called correctly', async () => {
		// Send getUserPicture request
		await usersApi.getUserPicture(user.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`users/${user.id}/picture`, RequestType.GET);
	});

	test('changeUserPicture is called correctly', async () => {
		const spyOnUploadFileFetchAPI = jest
			.spyOn(FetchUtils, 'uploadFileFetchAPI')
			.mockResolvedValue(true);
		// Send changeUserPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		await usersApi.changeUserPicture(user.id, testFile);

		expect(spyOnUploadFileFetchAPI).toHaveBeenCalledWith(
			`users/${user.id}/picture`,
			RequestType.PUT,
			testFile
		);
	});

	test('changeUserPicture is called with a too large file', async () => {
		// Set maxUserImageSizeInKb to 512kb
		const store = useStore.getState();
		store.setCapabilities(createMockCapabilityList({ maxUserImageSizeInKb: 512 }));
		// Send changeUserPicture request
		const testFile = new File([], 'image.png', { type: 'image/png' });
		Object.defineProperty(testFile, 'size', { value: 1024 * 1024 + 1 });

		expect(usersApi.changeUserPicture(user.id, testFile)).rejects.toThrowError('File too large');
		expect(spyOnFetch).not.toHaveBeenCalled();
	});

	test('deleteUserPicture is called correctly', async () => {
		// Send deleteUserPicture request
		await usersApi.deleteUserPicture(user.id);

		expect(spyOnFetch).toHaveBeenCalledWith(`users/${user.id}/picture`, RequestType.DELETE);
	});
});
