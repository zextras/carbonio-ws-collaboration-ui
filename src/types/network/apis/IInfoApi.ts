/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GetLicenseResponse, GetTokenResponse } from '../responses/infoResponses';

interface IInfoApi {
	getLicense(): Promise<GetLicenseResponse>;
	getToken(): Promise<GetTokenResponse>;
}

export default IInfoApi;
