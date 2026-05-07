/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { GetUserResponse, GetUsersResponse } from '../../types/network/responses/usersResponses';
import { fetchAPI } from '../../utils/FetchUtils';

export const getUser = (userId: string): Promise<GetUserResponse> => {
	const { setUserInfo } = useStore.getState();
	return fetchAPI<GetUserResponse>(`users/${userId}`, RequestType.GET).then((resp) => {
		setUserInfo([resp]);
		return resp;
	});
};

export const getUsers = (userIds: string[]): Promise<GetUsersResponse> => {
	const { setUserInfo } = useStore.getState();
	const params = userIds.map((id) => `userIds=${id}`).join('&');
	return fetchAPI<GetUsersResponse>(`users?${params}`, RequestType.GET).then((resp) => {
		setUserInfo(resp);
		return resp;
	});
};

// Default export: namespace object for backward-compat with jest.spyOn in test mocks.
// Callers should prefer the named exports above.
const usersApiNamespace = {
	getUser,
	getUsers
};

export default usersApiNamespace;
