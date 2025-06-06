/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
/**
 * Zextras Carbonio Workstream Collaboration API
 * Zextras Carbonio Workstream Collaboration HTTP APIs definition.
 * OpenAPI spec version: 1.6.0
 */
import type {
	N200HealthStatusResponse,
	N204IsLiveResponse,
	N204IsReadyResponse
} from '../api.schemas';

/**
 * @summary Returns the general service status
 */
export const getGetHealthStatusUrl = () => `/health`;

export const getHealthStatus = async (options?: RequestInit): Promise<N200HealthStatusResponse> => {
	const res = await fetch(getGetHealthStatusUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200HealthStatusResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Returns 204 if the service is alive
 */
export const getIsLiveUrl = () => `/health/live`;

export const isLive = async (options?: RequestInit): Promise<N204IsLiveResponse> => {
	const res = await fetch(getIsLiveUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204IsLiveResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Returns 204 if the service is ready to receive requests
 */
export const getIsReadyUrl = () => `/health/ready`;

export const isReady = async (options?: RequestInit): Promise<N204IsReadyResponse> => {
	const res = await fetch(getIsReadyUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N204IsReadyResponse = body ? JSON.parse(body) : {};

	return data;
};
