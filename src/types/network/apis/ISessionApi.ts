/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GetCapabilitiesResponse, GetTokenResponse } from '../responses/sessionResponses';

interface IUsersApi {
	getToken(): Promise<GetTokenResponse>;
	getCapabilities(): Promise<GetCapabilitiesResponse>;
}

export default IUsersApi;
