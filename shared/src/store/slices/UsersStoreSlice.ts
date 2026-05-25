/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { forEach } from 'lodash';
import { StateCreator } from 'zustand';

import { UserBe } from '../../types/network/models/userBeTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { UsersStoreSlice, UserType } from '../../types/store/UserTypes';

export const useUsersStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	UsersStoreSlice
> = (set) => ({
	users: {},
	setUserInfo: (users: UserBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(users, (user) => {
					draft.users[user.id] = {
						...draft.users[user.id],
						id: user.id,
						email: user.email,
						name: user.name,
						type: user.type
					};
				});
			}),
			false,
			'USERS/SET_USER_INFO'
		);
	},
	setUserPresence: (id: string, presence: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					online: presence
				};
			}),
			false,
			'USERS/SET_PRESENCE'
		);
	},
	setUserLastActivity: (id: string, date?: number): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					lastActivity: date
				};
			}),
			false,
			'USERS/SET_LAST_ACTIVITY'
		);
	},
	setAnonymousUser: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					id,
					type: UserType.ANONYMOUS
				};
			}),
			false,
			'USERS/SET_ANONYMOUS_USER'
		);
	}
});
