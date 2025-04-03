/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import { createMockUser } from '../../tests/createMock';
import { UserType } from '../../types/store/UserTypes';
import useStore from '../Store';

const user1 = createMockUser({ id: 'user1-id', email: 'user1@test.com', name: 'User 1' });

const user2 = createMockUser({
	id: 'user2-id',
	email: 'user2@test.com',
	name: 'User 2',
	type: UserType.GUEST
});

describe('UsersStoreSlice tests', () => {
	describe('userInfo', () => {
		test('Set first users', () => {
			useStore.getState().setUserInfo([user1, user2]);

			const store = useStore.getState();
			expect(size(store.users)).toBe(2);
			expect(store.users[user1.id]).toEqual(user1);
			expect(store.users[user2.id]).toEqual(user2);
		});

		test('setUserInfo should not override existing users', () => {
			useStore.setState({
				users: {
					[user1.id]: user1
				}
			});
			useStore.getState().setUserInfo([user2]);

			const store = useStore.getState();
			expect(size(store.users)).toBe(2);
			expect(store.users[user1.id]).toEqual(user1);
			expect(store.users[user2.id]).toEqual(user2);
		});

		test('Add user info after setting presence do not clear presence', () => {
			const store = useStore.getState();
			store.setUserPresence(user1.id, true);
			store.setUserInfo([user1]);

			expect(useStore.getState().users[user1.id].online).toBe(true);
		});
	});

	describe('presence', () => {
		test('Set user presence', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setUserPresence(user1.id, true);

			expect(useStore.getState().users[user1.id].online).toBe(true);
		});

		test('Set user presence to false', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setUserPresence(user1.id, false);

			expect(useStore.getState().users[user1.id].online).toBe(false);
		});

		test('Presence can be set also for non existing users', () => {
			const store = useStore.getState();
			store.setUserPresence(user1.id, true);

			expect(useStore.getState().users[user1.id].online).toBe(true);
		});
	});

	describe('lastActivity', () => {
		test('Set user lastActivity', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setUserLastActivity(user1.id, 1234567890);

			expect(useStore.getState().users[user1.id].lastActivity).toBe(1234567890);
		});

		test('Reset lastActivity', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setUserLastActivity(user1.id);

			expect(useStore.getState().users[user1.id].lastActivity).toBeUndefined();
		});
	});

	describe('anonymous user', () => {
		test('Set anonymous user', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setAnonymousUser(user1.id);

			expect(useStore.getState().users[user1.id].type).toBe(UserType.ANONYMOUS);
		});

		test('Set anonymous user with lastActivity', () => {
			const store = useStore.getState();
			store.setUserInfo([user1]);
			store.setUserLastActivity(user1.id, 1234567);
			store.setAnonymousUser(user1.id);

			expect(useStore.getState().users[user1.id].type).toBe(UserType.ANONYMOUS);
			expect(useStore.getState().users[user1.id].lastActivity).toBe(1234567);
		});
	});
});
