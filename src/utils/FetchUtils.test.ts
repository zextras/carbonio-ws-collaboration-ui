/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { fetchAPI, uploadFileFetchAPI } from './FetchUtils';
import useStore from '../store/Store';
import { spyOnFetch } from '../tests/jest-env-setup';
import { RequestType } from '../types/network/apis/IBaseAPI';

const contentType = 'Content-Type';
const applicationJson = 'application/json';
const defPath = '/services/chats/test';

const fetchResponse: jest.Mock = jest.fn(() => ({}));
const fetchBlobResponse: jest.Mock = jest.fn(() => ({}));
const getHeaders: jest.Mock = jest.fn(() => 'application/json');

beforeEach(() => {
	Object.defineProperty(global, 'fetch', {
		value: jest.fn(() =>
			Promise.resolve({
				json: () => fetchResponse(),
				blob: () => fetchBlobResponse(),
				ok: true,
				headers: { get: getHeaders }
			})
		),
		configurable: true
	});
});

describe('FetchUtils', () => {
	test('test fetchApi is called correctly', async () => {
		spyOnFetch.mockRestore();
		act(() => {
			useStore.getState().setQueueId('idUser1');
		});

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);
		headers.append('queue-id', 'idUser1');

		await fetchAPI('test', RequestType.GET);

		expect(global.fetch).toHaveBeenCalledWith(defPath, {
			method: RequestType.GET,
			headers,
			body: undefined
		});
	});

	test('test fetchApi reject for response status not ok', async () => {
		spyOnFetch.mockRestore();
		const mockErrResp = {
			ok: false,
			status: 400
		};
		(global.fetch as jest.Mock).mockResolvedValue(mockErrResp);

		await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
	});

	test('test uploadFileFetchAPI is called correctly', async () => {
		act(() => {
			const store = useStore.getState();
			store.setQueueId('idUser1');
		});
		const testImageFile = new File([], 'hello.png', { type: 'image/png' });

		const optField = {
			description: 'description',
			messageId: 'messageId',
			replyId: 'replyId',
			area: '0x0'
		};
		const headers = new Headers();
		headers.append(contentType, applicationJson);
		headers.append('description', optField.description);
		headers.append('messageId', optField.messageId);
		headers.append('replyId', optField.replyId);
		headers.append('area', optField.area);
		const { signal } = new AbortController();

		const reader = new FileReader();
		let fileBuffer;
		const handleOnLoadedEnd = (): void => {
			fileBuffer = reader.result;
		};
		reader.addEventListener('loadend', handleOnLoadedEnd);
		reader.readAsArrayBuffer(testImageFile);

		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			headers,
			testImageFile
		});
		await uploadFileFetchAPI('test', RequestType.POST, testImageFile, signal, optField);

		expect(global.fetch).toHaveBeenCalledWith(
			defPath,
			expect.objectContaining({
				method: RequestType.POST,
				headers,
				body: fileBuffer,
				signal
			})
		);
	});

	test('test uploadFileFetchAPI rejects', async () => {
		const testImageFile = new File([], 'hello.png', { type: 'image/png' });

		const mockErrResp = {
			ok: false,
			status: 400
		};
		(global.fetch as jest.Mock).mockResolvedValue(mockErrResp);

		await expect(uploadFileFetchAPI(defPath, RequestType.POST, testImageFile)).rejects.toThrow();
	});
});
