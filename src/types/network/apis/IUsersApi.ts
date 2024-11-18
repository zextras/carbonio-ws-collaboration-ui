/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GetUserResponse, GetUsersResponse } from '../responses/usersResponses';

interface IUsersApi {
	getUser(userId: string): Promise<GetUserResponse>;
	getUsers(userId: string[]): Promise<GetUsersResponse>;
}

export default IUsersApi;
