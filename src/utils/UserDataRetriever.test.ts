/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as uuid from 'uuid';

import UserDataRetriever from './UserDataRetriever';
import useStore from '../store/Store';
import { UserType } from '../types/store/UserTypes';
import * as api from 'wsc-shared';

const user1 = {
	id: 'user1-id',
	email: 'user1-email',
	name: 'User Uno',
	type: UserType.INTERNAL
};

describe('UserDataRetriever tests', () => {
	test('getDebouncedUser is correctly used with few users', async () => {
		const spyOnGetUsers = vi.spyOn(api, 'getUsers').mockResolvedValue([]);
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		// Finish debounced function
		vi.runAllTimers();

		expect(spyOnGetUsers).toHaveBeenCalledTimes(1);
	});

	test('getDebouncedUser is correctly used with a lot of users', async () => {
		const spyOnGetUsers = vi.spyOn(api, 'getUsers').mockResolvedValue([]);
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

		expect(spyOnGetUsers).toHaveBeenCalledTimes(2);
	});

	test('getDebouncedUser is correctly used with a duplicated userId', async () => {
		const spyOnGetUsers = vi.spyOn(api, 'getUsers').mockResolvedValue([]);
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

		expect(spyOnGetUsers).toHaveBeenCalledTimes(1);
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
