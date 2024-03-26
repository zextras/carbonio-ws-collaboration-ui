/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { UserBe } from '../../types/network/models/userBeTypes';
import { RootStore, UsersStoreSlice } from '../../types/store/StoreTypes';

export const useUsersStoreSlice: StateCreator<UsersStoreSlice> = (set: (...any: any) => void) => ({
	users: {},
	setUserInfo: (user: UserBe): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[user.id] = {
					...draft.users[user.id],
					id: user.id,
					email: user.email,
					name: user.name,
					lastSeen: user.lastSeen,
					statusMessage: user.statusMessage,
					pictureUpdatedAt: user.pictureUpdatedAt
				};
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
	setUserLastActivity: (id: string, date: number): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					last_activity: date
				};
			}),
			false,
			'USERS/SET_LAST_ACTIVITY'
		);
	},
	setUserStatusMessage: (id: string, statusMsg: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					statusMessage: statusMsg
				};
			}),
			false,
			'USERS/SET_STATUS_MESSAGE'
		);
	},
	setUserPictureUpdated: (id: string, date: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					pictureUpdatedAt: date
				};
			}),
			false,
			'USERS/USER_PICTURE_CHANGED'
		);
	},
	setUserPictureDeleted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.users[id] = {
					...draft.users[id],
					pictureUpdatedAt: undefined
				};
			}),
			false,
			'USERS/USER_PICTURE_DELETED'
		);
	}
});
