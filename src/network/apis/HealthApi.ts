/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RequestType } from '../../types/network/apis/IBaseAPI';
import IHealthApi from '../../types/network/apis/IHealthApi';
import {
	GetServiceStatusResponse,
	TestServiceLifeResponse,
	TestServiceStatusResponse
} from '../../types/network/responses/healthResponses';
import BaseAPI from './BaseAPI';

class HealthApi extends BaseAPI implements IHealthApi {
	// Singleton design pattern
	private static instance: IHealthApi;

	public static getInstance(): IHealthApi {
		if (!HealthApi.instance) {
			HealthApi.instance = new HealthApi();
		}
		return HealthApi.instance;
	}

	public getServiceStatus(): Promise<GetServiceStatusResponse> {
		return this.fetchAPI(`health`, RequestType.GET);
	}

	public testServiceLife(): Promise<TestServiceLifeResponse> {
		return this.fetchAPI(`health/live`, RequestType.GET);
	}

	public testServiceStatus(): Promise<TestServiceStatusResponse> {
		return this.fetchAPI(`health/status`, RequestType.GET);
	}
}

export default HealthApi.getInstance();
