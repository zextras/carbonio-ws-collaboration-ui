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
import type { N200GetTokensResponse } from '../api.schemas';

/**
 * @summary Fetches the authenticated token
 */
export const getGetTokenUrl = () => `/auth/token`;

export const getToken = async (options?: RequestInit): Promise<N200GetTokensResponse> => {
	const res = await fetch(getGetTokenUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetTokensResponse = body ? JSON.parse(body) : {};

	return data;
};
