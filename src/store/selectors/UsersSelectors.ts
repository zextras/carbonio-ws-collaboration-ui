/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { RootStore } from '../../types/store/StoreTypes';
import { User, UsersMap, UserType } from '../../types/store/UserTypes';
import UserDataRetriever from '../../utils/UserDataRetriever';

export const getUsersSelector = (store: RootStore): UsersMap => store.users;

export const getUserSelector = (store: RootStore, id: string | undefined): User | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return id ? store.users[id] : undefined;
};

export const getUserName = (store: RootStore, id: string): string => {
	UserDataRetriever.getDebouncedUser(id);
	if (store.users[id]?.type === UserType.ANONYMOUS) {
		return t('status.Anonymous', 'Anonymous user');
	}
	return store.users[id]?.name || store.users[id]?.email || '';
};

export const getUserLastActivity = (store: RootStore, id: string): number | undefined =>
	store.users[id]?.last_activity;

export const getUserOnline = (store: RootStore, id: string): boolean | undefined =>
	store.users[id]?.online;

export const getUserEmail = (store: RootStore, id: string): string | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.email;
};

export const getUserStatusMessage = (store: RootStore, id: string): string | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.statusMessage;
};

export const getUserPictureUpdatedAt = (store: RootStore, id: string): string | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.pictureUpdatedAt;
};

export const getIsUserGuest = (store: RootStore, id: string): boolean | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.type === UserType.GUEST;
};

export const getIsAnonymousUser = (store: RootStore, id: string): boolean =>
	store.users[id]?.type === UserType.ANONYMOUS;
