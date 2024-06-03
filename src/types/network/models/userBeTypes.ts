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
	type: UserType;
	lastSeen?: number;
	statusMessage?: string;
	pictureUpdatedAt?: string;
};
