/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	GetServiceStatusResponse,
	TestServiceLifeResponse,
	TestServiceStatusResponse
} from '../responses/healthResponses';

interface IHealthApi {
	getServiceStatus(): Promise<GetServiceStatusResponse>;
	testServiceLife(): Promise<TestServiceLifeResponse>;
	testServiceStatus(): Promise<TestServiceStatusResponse>;
}

export default IHealthApi;
