/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { Mock } from 'vitest';

import {
	fetchAPI,
	RequestType,
	sendFileFetchAPI,
	uploadFileFetchAPI,
	wscApiVersionHeader
} from './FetchUtils';
import { charToUnicode } from './textUtils';
import useStore from '../store/Store';

const defPath = '/services/chats/test';

const fetchResponse = vi.fn(() => ({}));
const fetchBlobResponse = vi.fn(() => ({}));

beforeEach(() => {
	Object.defineProperty(global, 'fetch', {
		value: vi.fn(() =>
			Promise.resolve({
				json: () => fetchResponse(),
				blob: () => fetchBlobResponse(),
				ok: true,
				headers: {
					get: () => 'application/json'
				}
			})
		),
		configurable: true
	});
	useStore.getState().setSupportedVersions(['1.6.0']);
});

describe('FetchUtils', () => {
	test('fetchApi is called correctly', async () => {
		act(() => {
			useStore.getState().setQueueId('idUser1');
			useStore.getState().setApiVersion('1.0.0');
		});

		await fetchAPI('test', RequestType.GET);

		expect(global.fetch).toHaveBeenCalledWith(defPath, {
			method: RequestType.GET,
			headers: expect.any(Headers),
			body: undefined
		});

		const [_, { headers }] = (global.fetch as Mock).mock.calls[0];
		expect(headers.get('queue-id')).toBe('idUser1');
		expect(headers.get(wscApiVersionHeader)).toBe('1.0.0');
	});

	test('fetchApi reject for response status not ok', async () => {
		const mockErrResp = {
			ok: false,
			status: 400
		};
		(global.fetch as Mock).mockResolvedValue(mockErrResp);

		await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
	});

	test('Set correct version after version mismatch error', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const mockErrResp = {
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as Mock).mockResolvedValueOnce(mockErrResp);
		const mockValidResp = {
			ok: true,
			status: 200,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as Mock).mockResolvedValueOnce(mockValidResp);
		await fetchAPI('test', RequestType.GET);
		expect(useStore.getState().session.apiVersion).toBe('1.6.0');
	});

	test('Recall fetch after a version mismatch error', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const mockErrResp = {
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as Mock).mockResolvedValueOnce(mockErrResp);
		const mockValidResp = {
			ok: true,
			status: 200,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as Mock).mockResolvedValueOnce(mockValidResp);
		await fetchAPI('test', RequestType.GET);
		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	test('Stop retrying after max retries on persistent version mismatch', async () => {
		useStore
			.getState()
			.setSupportedVersions(['2.0.0', '1.6.4', '1.6.3', '1.6.2', '1.6.1', '1.6.0']);

		let callCount = 0;
		const mockErrResp = (
			count: number
		): {
			ok: boolean;
			status: number;
			headers: { get: (header: string) => string | undefined };
		} => ({
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? `1.6.${count}` : undefined
			}
		});
		(global.fetch as Mock).mockImplementation(() => {
			callCount += 1;
			return Promise.resolve(mockErrResp(callCount));
		});
		await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('version_mismatch');
		expect(global.fetch).toHaveBeenCalledTimes(4);
	});

	test('Return error if version choose by the server is not supported by the client', async () => {
		useStore.getState().setSupportedVersions(['2.0.0']);
		const mockErrResp = {
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? '1.6.0' : undefined
			}
		};
		(global.fetch as Mock).mockResolvedValueOnce(mockErrResp);
		await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
	});

	test('sendFileFetchApi is called correctly', async () => {
		act(() => {
			useStore.getState().setQueueId('idUser1');
			useStore.getState().setApiVersion('1.6.1');
		});

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
				body: expect.any(FormData),
				signal: undefined,
				headers: expect.any(Headers)
			})
		);
		const [_, { headers, body }] = (global.fetch as any).mock.calls[0];
		expect(headers.get('queue-id')).toBe('idUser1');
		expect(headers.get(wscApiVersionHeader)).toBe('1.6.1');
		expect(body.get('description')).toBe(charToUnicode(optField.description));
		expect(body.get('messageId')).toBe(optField.messageId);
		expect(body.get('replyId')).toBe(optField.replyId);
		expect(body.get('area')).toBe(optField.area);
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
		const { signal } = new AbortController();

		const reader = new FileReader();
		let fileBuffer;
		const handleOnLoadedEnd = (): void => {
			fileBuffer = reader.result;
		};
		reader.addEventListener('loadend', handleOnLoadedEnd);
		reader.readAsArrayBuffer(testImageFile);
		await uploadFileFetchAPI('test', RequestType.POST, testImageFile, signal, optField);

		expect(global.fetch).toHaveBeenCalledWith(defPath, {
			method: RequestType.POST,
			headers: expect.any(Headers),
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
		(global.fetch as Mock).mockResolvedValue(mockErrResp);

		await expect(uploadFileFetchAPI(defPath, RequestType.POST, testImageFile)).rejects.toThrow();
	});
});
