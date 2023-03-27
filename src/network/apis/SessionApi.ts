/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BaseAPI from './BaseAPI';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import ISessionApi from '../../types/network/apis/ISessionApi';
import {
	GetCapabilitiesResponse,
	GetTokenResponse
} from '../../types/network/responses/sessionResponses';

class SessionApi extends BaseAPI implements ISessionApi {
	// Singleton design pattern
	private static instance: ISessionApi;

	public static getInstance(): ISessionApi {
		if (!SessionApi.instance) {
			SessionApi.instance = new SessionApi();
		}
		return SessionApi.instance;
	}

	public getToken(): Promise<GetTokenResponse> {
		return this.fetchAPI(`auth/token`, RequestType.GET);
	}

	public getCapabilities(): Promise<GetCapabilitiesResponse> {
		return this.fetchAPI(`users/capabilities`, RequestType.GET).then(
			(resp: GetCapabilitiesResponse) => {
				const { setCapabilities } = useStore.getState();
				setCapabilities(resp);
				return resp;
			}
		);
	}
}

export default SessionApi.getInstance();
