/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RequestType } from '../../types/network/apis/IBaseAPI';
import ISessionApi from '../../types/network/apis/ISessionApi';
import { GetTokenResponse } from '../../types/network/responses/sessionResponses';
import { fetchAPI } from '../../utils/FetchUtils';

class SessionApi implements ISessionApi {
	// Singleton design pattern
	private static instance: ISessionApi;

	public static getInstance(): ISessionApi {
		if (!SessionApi.instance) {
			SessionApi.instance = new SessionApi();
		}
		return SessionApi.instance;
	}

	public getToken(): Promise<GetTokenResponse> {
		return fetchAPI(`auth/token`, RequestType.GET);
	}
}

export default SessionApi.getInstance();
