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
	GetUsersParams,
	N200GetCapabilities,
	N200GetUserResponse,
	N200GetUsersByIdsResponse
} from '../api.schemas';

/**
 * @summary Retrieves users
 */
export const getGetUsersUrl = (params: GetUsersParams) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0 ? `/users?${stringifiedParams}` : `/users`;
};

export const getUsers = async (
	params: GetUsersParams,
	options?: RequestInit
): Promise<N200GetUsersByIdsResponse> => {
	const res = await fetch(getGetUsersUrl(params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetUsersByIdsResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieve current user capabilities
 */
export const getGetCapabilitiesUrl = () => `/users/capabilities`;

export const getCapabilities = async (options?: RequestInit): Promise<N200GetCapabilities> => {
	const res = await fetch(getGetCapabilitiesUrl(), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetCapabilities = body ? JSON.parse(body) : {};

	return data;
};

/**
 * @summary Retrieves a user
 */
export const getGetUserUrl = (userId: string) => `/users/${userId}`;

export const getUser = async (
	userId: string,
	options?: RequestInit
): Promise<N200GetUserResponse> => {
	const res = await fetch(getGetUserUrl(userId), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200GetUserResponse = body ? JSON.parse(body) : {};

	return data;
};
