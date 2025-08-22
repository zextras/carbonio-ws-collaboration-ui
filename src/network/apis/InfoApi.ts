/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RequestType } from '../../types/network/apis/IBaseAPI';
import IInfoApi from '../../types/network/apis/IInfoApi';
import { GetLicenseResponse, GetTokenResponse } from '../../types/network/responses/infoResponses';
import { fetchAPI } from '../../utils/FetchUtils';

class InfoApi implements IInfoApi {
	// Singleton design pattern
	private static instance: IInfoApi;

	public static getInstance(): IInfoApi {
		if (!InfoApi.instance) {
			InfoApi.instance = new InfoApi();
		}
		return InfoApi.instance;
	}

	public getLicense(): Promise<GetLicenseResponse> {
		return fetchAPI(`license`, RequestType.GET);
	}

	public getToken(): Promise<GetTokenResponse> {
		return fetchAPI(`auth/token`, RequestType.GET);
	}
}

export default InfoApi.getInstance();
