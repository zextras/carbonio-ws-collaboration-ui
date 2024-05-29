/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UserType } from '../../store/UserTypes';

export type UserBe = {
	id: string;
	email: string;
	name: string;
	userType: UserType;
	lastSeen?: number; // TODO REMOVE BACKEND DON'T SEND IT
	statusMessage?: string;
	pictureUpdatedAt?: string;
};
