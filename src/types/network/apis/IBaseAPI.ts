/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

interface IBaseAPI {
	fetchAPI(
		endpoint: string,
		method: RequestType,
		data?: Record<string, unknown>
	): Promise<Response>;
}

export enum RequestType {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE'
}

export default IBaseAPI;
