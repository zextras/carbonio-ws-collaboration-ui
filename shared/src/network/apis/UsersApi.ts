/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { join, map } from 'lodash';

import { sharedConfig } from '../../config';
import { RequestType } from '../../types/network/fetch';
import { UserBe } from '../../types/network/models/userBeTypes';

export const getUser = (userId: string): Promise<UserBe> =>
	sharedConfig.fetchAPI<UserBe>(`users/${userId}`, RequestType.GET).then((resp) => {
		sharedConfig.useStore.getState().setUserInfo([resp]);
		return resp;
	});

export const getUsers = (userIds: string[]): Promise<UserBe[]> => {
	const ids = map(userIds, (id) => `userIds=${id}`);
	return sharedConfig
		.fetchAPI<UserBe[]>(`users?${join(ids, '&')}`, RequestType.GET)
		.then((resp) => {
			sharedConfig.useStore.getState().setUserInfo(resp);
			return resp;
		});
};
