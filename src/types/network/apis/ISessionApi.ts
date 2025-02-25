/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GetTokenResponse } from '../responses/sessionResponses';

interface ISessionApi {
	getToken(): Promise<GetTokenResponse>;
}

export default ISessionApi;
