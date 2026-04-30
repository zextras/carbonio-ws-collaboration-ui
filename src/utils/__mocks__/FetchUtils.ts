/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockFetchAPI = vi.fn().mockImplementation(() => Promise.resolve({}));
export const mockSendFileFetchAPI = vi.fn().mockImplementation(() => Promise.resolve({}));
export const mockUploadFileFetchAPI = vi.fn().mockImplementation(() => Promise.resolve({}));

export const fetchAPI = mockFetchAPI;

export const sendFileFetchAPI = mockSendFileFetchAPI;

export const uploadFileFetchAPI = mockUploadFileFetchAPI;

export const BASE_PATH = '/services/chats/';
export const wscApiVersionHeader = 'X-WSC-API-VERSION';
export const contentTypeHeader = 'Content-Type';

export enum RequestType {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE'
}

export { buildQueryString } from '../FetchUtils';
