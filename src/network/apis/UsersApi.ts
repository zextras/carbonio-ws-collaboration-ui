/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { join, map } from 'lodash';

import useStore from '../../store/Store';
import { UserBe } from '../../types/network/models/userBeTypes';
import { fetchAPI, RequestType } from '../../utils/FetchUtils';

export const getUser = (userId: string): Promise<UserBe> =>
	fetchAPI<UserBe>(`users/${userId}`, RequestType.GET).then((resp) => {
		useStore.getState().setUserInfo([resp]);
		return resp;
	});

export const getUsers = (userIds: string[]): Promise<UserBe[]> => {
	const ids = map(userIds, (id) => `userIds=${id}`);
	return fetchAPI<UserBe[]>(`users?${join(ids, '&')}`, RequestType.GET).then((resp) => {
		useStore.getState().setUserInfo(resp);
		return resp;
	});
};
