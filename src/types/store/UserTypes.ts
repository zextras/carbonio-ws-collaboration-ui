/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type User = {
	id: string;
	email: string;
	name: string;
	type: UserType;
	lastSeen?: number;
	statusMessage?: string;
	online?: boolean;
	last_activity?: number;
	pictureUpdatedAt?: string;
};

export type UsersMap = {
	[id: string]: User;
};

export enum UserType {
	INTERNAL = 'internal',
	GUEST = 'guest',
	ANONYMOUS = 'anonymous'
}
