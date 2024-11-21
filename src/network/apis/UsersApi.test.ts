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
import { spyOnFetch } from '../../tests/jest-env-setup';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { UserBe } from '../../types/network/models/userBeTypes';

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
});
