/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import UserDataRetriever from '../../utils/UserDataRetriever';
import { RootStore, User, UsersMap, UserType } from 'wsc-shared';

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
	store.users[id]?.lastActivity;

export const getUserOnline = (store: RootStore, id: string): boolean => !!store.users[id]?.online;

export const getUserEmail = (store: RootStore, id: string): string | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.email;
};

export const getIsUserGuest = (store: RootStore, id: string): boolean | undefined => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.type === UserType.GUEST;
};

export const getIsAnonymousUser = (store: RootStore, id: string): boolean =>
	store.users[id]?.type === UserType.ANONYMOUS;
