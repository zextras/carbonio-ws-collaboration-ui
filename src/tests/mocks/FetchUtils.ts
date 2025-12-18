/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const mockFetchAPI = vi.fn().mockImplementation(() => Promise.resolve({}));
export const mockSendFileFetchAPI = vi.fn();
export const mockUploadFileFetchAPI = vi.fn();

vi.mock('../../utils/FetchUtils', () => ({
	fetchAPI: mockFetchAPI,
	sendFileFetchAPI: mockSendFileFetchAPI,
	uploadFileFetchAPI: mockUploadFileFetchAPI,
	BASE_PATH: '/services/chats/',
	wscApiVersionHeader: 'X-WSC-API-VERSION',
	contentTypeHeader: 'Content-Type'
}));