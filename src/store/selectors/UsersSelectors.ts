/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { UsersApi } from '../../network';
import { RootStore } from '../../types/store/StoreTypes';
import { User, UsersMap, UserType } from '../../types/store/UserTypes';

export const getUsersSelector = (store: RootStore): UsersMap => store.users;

export const getUserSelector = (store: RootStore, id: string | undefined): User | undefined => {
	UsersApi.getDebouncedUser(id);
	return id ? store.users[id] : undefined;
};

export const getUserName = (store: RootStore, id: string): string => {
	UsersApi.getDebouncedUser(id);
	return store.users[id]?.name || store.users[id]?.email || t('status.Anonymous', 'Anonymous user');
};

export const getUserLastActivity = (store: RootStore, id: string): number | undefined =>
	store.users[id]?.last_activity;

export const getUserOnline = (store: RootStore, id: string): boolean | undefined =>
	store.users[id]?.online;

export const getUserEmail = (store: RootStore, id: string): string | undefined => {
	UsersApi.getDebouncedUser(id);
	return store.users[id]?.email;
};

export const getUserStatusMessage = (store: RootStore, id: string): string | undefined => {
	UsersApi.getDebouncedUser(id);
	return store.users[id]?.statusMessage;
};

export const getUserPictureUpdatedAt = (store: RootStore, id: string): string | undefined => {
	UsersApi.getDebouncedUser(id);
	return store.users[id]?.pictureUpdatedAt;
};

export const getIsUserGuest = (store: RootStore, id: string): boolean | undefined => {
	UsersApi.getDebouncedUser(id);
	return store.users[id]?.type === UserType.GUEST;
};

export const getAreUserInfoAvailable = (store: RootStore, id: string): boolean => {
	const user = getUserSelector(store, id);
	return !!user?.name || !!user?.email;
};
