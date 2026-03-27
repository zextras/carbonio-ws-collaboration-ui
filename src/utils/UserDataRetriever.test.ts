/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as uuid from 'uuid';

import UserDataRetriever from './UserDataRetriever';
import useStore from '../store/Store';
import { mockFetchAPI } from './__mocks__/FetchUtils';
import * as api from '../network/apis/UsersApi';
import { UserType } from '../types/store/UserTypes';

const user1 = {
	id: 'user1-id',
	email: 'user1-email',
	name: 'User Uno',
	type: UserType.INTERNAL
};

vi.mock('./FetchUtils');

describe('UserDataRetriever tests', () => {
	test('getDebouncedUser is correctly used with few users', async () => {
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		// Finish debounced function
		vi.runAllTimers();

		expect(mockFetchAPI).toHaveBeenCalledTimes(1);
	});

	test('getDebouncedUser is correctly used with a lot of users', async () => {
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		// Second group of users
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());

		// Finish debounced function
		vi.runAllTimers();

		expect(mockFetchAPI).toHaveBeenCalledTimes(2);
	});

	test('getDebouncedUser is correctly used with a duplicated userId', async () => {
		const duplicateUuid = uuid.v6();
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(duplicateUuid);
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(duplicateUuid); // Duplicated id
		// Finish debounced function
		vi.runAllTimers();

		expect(mockFetchAPI).toHaveBeenCalledTimes(1);
	});

	test('If the name is in the store, getAsyncUsername return it', async () => {
		const spyOnGetUser = vi.spyOn(api, 'getUser');
		useStore.getState().setUserInfo([user1]);
		const name = await UserDataRetriever.getAsyncUsername(user1.id);
		expect(name).toEqual(user1.name);
		expect(spyOnGetUser).not.toHaveBeenCalled();
	});

	test('If the name is not in the store, getAsyncUsername request it', async () => {
		const spyOnGetUser = vi.spyOn(api, 'getUser').mockResolvedValueOnce(user1);
		const name = await UserDataRetriever.getAsyncUsername(user1.id);
		expect(name).toEqual(user1.name);
		expect(spyOnGetUser).toHaveBeenCalled();
	});
});
