/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UserBe } from '../network/models/userBeTypes';

export type UsersStoreSlice = {
	users: UsersMap;
	setUserInfo: (users: UserBe[]) => void;
	setUserPresence: (id: string, presence: boolean) => void;
	setUserLastActivity: (id: string, date?: number) => void;
	setAnonymousUser: (id: string) => void;
};

export type User = {
	id: string;
	email: string;
	name: string;
	type: UserType;
	online?: boolean;
	lastActivity?: number;
};

export type UsersMap = {
	[id: string]: User;
};

export enum UserType {
	INTERNAL = 'internal',
	GUEST = 'guest',
	ANONYMOUS = 'anonymous'
}
