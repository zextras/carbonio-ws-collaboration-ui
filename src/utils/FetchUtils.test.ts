/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { fetchAPI, sendFileFetchAPI, uploadFileFetchAPI, wscApiVersionHeader } from './FetchUtils';
import { charToUnicode } from './textUtils';
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
	test('fetchApi is called correctly', async () => {
		spyOnFetch.mockRestore();
		act(() => {
			useStore.getState().setQueueId('idUser1');
			useStore.getState().setApiVersion('1.0.0');
		});

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);
		headers.append('queue-id', 'idUser1');
		headers.append(wscApiVersionHeader, '1.0.0');
		getHeaders.mockResolvedValueOnce(headers);

		await fetchAPI('test', RequestType.GET);

		expect(global.fetch).toHaveBeenCalledWith(defPath, {
			method: RequestType.GET,
			headers,
			body: undefined
		});
	});

	test('fetchApi reject for response status not ok', async () => {
		spyOnFetch.mockRestore();
		const mockErrResp = {
			ok: false,
			status: 400
		};
		(global.fetch as jest.Mock).mockResolvedValue(mockErrResp);

		await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
	});

	test('Set correct version after version mismatch error', async () => {
		useStore.getState().setApiVersion('2.0.0');
		spyOnFetch.mockRestore();
		const mockErrResp = {
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as jest.Mock).mockResolvedValueOnce(mockErrResp);
		const mockValidResp = {
			ok: true,
			status: 200,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as jest.Mock).mockResolvedValueOnce(mockValidResp);
		await fetchAPI('test', RequestType.GET);
		expect(useStore.getState().session.apiVersion).toBe('1.6.0');
	});

	test('Recall fetch after a version mismatch error', async () => {
		useStore.getState().setApiVersion('2.0.0');
		spyOnFetch.mockRestore();
		const mockErrResp = {
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as jest.Mock).mockResolvedValueOnce(mockErrResp);
		const mockValidResp = {
			ok: true,
			status: 200,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as jest.Mock).mockResolvedValueOnce(mockValidResp);
		await fetchAPI('test', RequestType.GET);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	test('sendFileFetchApi is called correctly', async () => {
		spyOnFetch.mockRestore();
		act(() => {
			useStore.getState().setQueueId('idUser1');
			useStore.getState().setApiVersion('1.6.1');
		});

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);
		headers.append('queue-id', 'idUser1');
		headers.append(wscApiVersionHeader, '1.6.1');
		getHeaders.mockResolvedValueOnce(headers);

		const testImageFile = new File([], 'hello.png', { type: 'image/png' });

		const optField = {
			description: 'description',
			messageId: 'messageId',
			replyId: 'replyId',
			area: '0x0'
		};

		await sendFileFetchAPI('test', RequestType.PUT, testImageFile, undefined, optField);

		expect(global.fetch).toHaveBeenCalledWith(
			defPath,
			expect.objectContaining({
				method: RequestType.PUT,
				headers,
				signal: undefined
			})
		);
	});

	test('uploadFileFetchAPI is called correctly', async () => {
		act(() => {
			const store = useStore.getState();
			store.setQueueId('idUser1');
			store.setApiVersion('1.0.0');
		});
		const testImageFile = new File([], 'hello.png', { type: 'image/png' });

		const optField = {
			description: 'description',
			messageId: 'messageId',
			replyId: 'replyId',
			area: '0x0'
		};
		const headers = new Headers();
		headers.append('fileName', charToUnicode(testImageFile.name));
		headers.append('mimeType', testImageFile.type);
		headers.append('description', charToUnicode(optField.description));
		headers.append('messageId', optField.messageId);
		headers.append('replyId', optField.replyId);
		headers.append('area', optField.area);
		headers.append('queue-id', 'idUser1');
		headers.append(wscApiVersionHeader, '1.0.0');

		const { signal } = new AbortController();

		const reader = new FileReader();
		let fileBuffer;
		const handleOnLoadedEnd = (): void => {
			fileBuffer = reader.result;
		};
		reader.addEventListener('loadend', handleOnLoadedEnd);
		reader.readAsArrayBuffer(testImageFile);

		getHeaders.mockResolvedValueOnce(headers);
		await uploadFileFetchAPI('test', RequestType.POST, testImageFile, signal, optField);

		expect(global.fetch).toHaveBeenCalledWith(defPath, {
			method: RequestType.POST,
			headers,
			body: fileBuffer,
			signal
		});
	});

	test('uploadFileFetchAPI rejects', async () => {
		const testImageFile = new File([], 'hello.png', { type: 'image/png' });

		const mockErrResp = {
			ok: false,
			status: 400
		};
		(global.fetch as jest.Mock).mockResolvedValue(mockErrResp);

		await expect(uploadFileFetchAPI(defPath, RequestType.POST, testImageFile)).rejects.toThrow();
	});
});
