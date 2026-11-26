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
	sendAttachmentFetchAPI,
	sendFileFetchAPI,
	UPLOAD_STALL_TIMEOUT_MS,
	uploadFileFetchAPI,
	wscApiVersionHeader
} from './FetchUtils';
import { charToUnicode } from './textUtils';
import useStore from '../store/Store';
import { Version } from '../types/store/SessionTypes';

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

	test('fetchApi rejection carries the HTTP status', async () => {
		(global.fetch as Mock).mockResolvedValue({ ok: false, status: 424 });

		await expect(fetchAPI('test', RequestType.GET)).rejects.toMatchObject({
			message: 'status ko',
			status: 424
		});
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

	describe('version fallback when the server version is not in the supported list', () => {
		const supported: Array<Version> = ['2.0.0', '1.6.15', '1.6.14', '1.6.13'];
		const mismatch = (serverVersion: string): Record<string, unknown> => ({
			ok: false,
			status: 422,
			headers: {
				get: (header: string): string | undefined =>
					header === wscApiVersionHeader ? serverVersion : undefined
			}
		});
		const okResp = {
			ok: true,
			status: 200,
			headers: { get: (): string => 'text/plain' }
		};

		test.each([
			['1.6.16', '1.6.15'],
			['1.6.99', '1.6.15'],
			['1.6.14', '1.6.14'],
			['2.1.0', '2.0.0'],
			['3.0.0', '2.0.0']
		])('server %s -> client retries with %s', async (serverVersion, expected) => {
			useStore.getState().setSupportedVersions(supported);
			useStore.getState().setApiVersion('1.6.13');
			(global.fetch as Mock)
				.mockResolvedValueOnce(mismatch(serverVersion))
				.mockResolvedValueOnce(okResp);
			await fetchAPI('test', RequestType.GET);
			expect(useStore.getState().session.apiVersion).toBe(expected);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		test('server older than every supported version -> error', async () => {
			useStore.getState().setSupportedVersions(supported);
			useStore.getState().setApiVersion('2.0.0');
			(global.fetch as Mock).mockResolvedValueOnce(mismatch('1.6.2'));
			await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		test('fallback equal to the version already sent -> error, no retry', async () => {
			useStore.getState().setSupportedVersions(supported);
			useStore.getState().setApiVersion('1.6.15');
			(global.fetch as Mock).mockResolvedValueOnce(mismatch('1.6.16'));
			await expect(fetchAPI('test', RequestType.GET)).rejects.toThrow('status ko');
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});
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

	describe('sendAttachmentFetchAPI', () => {
		class FakeXhr extends EventTarget {
			static instances: FakeXhr[] = [];

			upload = new EventTarget();

			method = '';

			url = '';

			responseType = '';

			status = 0;

			statusText = '';

			response: string | null = null;

			headers: Record<string, string> = {};

			body: FormData | undefined;

			responseHeaders = '';

			open = vi.fn((method: string, url: string) => {
				this.method = method;
				this.url = url;
			});

			setRequestHeader = vi.fn((name: string, value: string) => {
				this.headers[name.toLowerCase()] = value;
			});

			send = vi.fn((body: FormData) => {
				this.body = body;
			});

			abort = vi.fn();

			constructor() {
				super();
				FakeXhr.instances.push(this);
			}

			getAllResponseHeaders = (): string => this.responseHeaders;

			emitUploadProgress(): void {
				this.upload.dispatchEvent(new Event('progress'));
			}

			emitUploadLoad(): void {
				this.upload.dispatchEvent(new Event('load'));
			}

			emitError(): void {
				this.dispatchEvent(new Event('error'));
			}

			respond(status: number, body: unknown = null, contentType = 'application/json'): void {
				this.status = status;
				this.responseHeaders = `Content-Type: ${contentType}\r\nX-Other: a:b\r\n`;
				this.response = body === null ? null : JSON.stringify(body);
				this.dispatchEvent(new Event('load'));
			}
		}

		const lastXhr = (): FakeXhr => FakeXhr.instances[FakeXhr.instances.length - 1];
		const file = new File(['abc'], 'a.pdf');
		const start = (signal?: AbortSignal): Promise<unknown> =>
			sendAttachmentFetchAPI('test', file, { tempId: 'tmp-1' }, signal);
		const outcomeOf = (promise: Promise<unknown>): Promise<unknown> =>
			promise.catch((error: unknown) => error);

		beforeEach(() => {
			FakeXhr.instances = [];
			vi.stubGlobal('XMLHttpRequest', FakeXhr);
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
			vi.unstubAllGlobals();
		});

		test('sends the v2 multipart: POST, raw UTF-8 description, escaped file name', async () => {
			act(() => {
				useStore.getState().setQueueId('idUser1');
				useStore.getState().setApiVersion('2.0.0');
			});
			const testImageFile = new File(['abc'], 'città.png', { type: 'image/png' });
			const { signal } = new AbortController();

			const result = sendAttachmentFetchAPI(
				'test',
				testImageFile,
				{
					tempId: 'tmp-1',
					description: 'una didascalia — "àèì" 👍',
					replyToId: 'msg-quoted',
					area: '640x480'
				},
				signal
			);
			const xhr = lastXhr();
			xhr.respond(201, { id: 'm1' });
			await result;

			expect(xhr.open).toHaveBeenCalledWith(RequestType.POST, defPath);
			expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData));
			const { headers, body } = xhr;
			expect(headers['queue-id']).toBe('idUser1');
			expect(headers[wscApiVersionHeader.toLowerCase()]).toBe('2.0.0');
			// The browser sets the multipart boundary
			expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain('content-type');
			// The backend decodes the file name, and stores the description as-is
			expect((body?.get('file') as File).name).toBe(charToUnicode('città.png'));
			expect(body?.get('contentLength')).toBe('3');
			expect(body?.get('tempId')).toBe('tmp-1');
			// Without an explicit charset the backend would read the part as US-ASCII
			const description = body?.get('description') as File;
			expect(description.type).toBe('text/plain;charset=utf-8');
			expect(await description.text()).toBe('una didascalia — "àèì" 👍');
			expect(body?.get('replyToId')).toBe('msg-quoted');
			expect(body?.get('area')).toBe('640x480');
			// None of the v1 correlation fields
			expect(body?.get('messageId')).toBeNull();
			expect(body?.get('replyId')).toBeNull();
			expect(headers['x-temp-id']).toBeUndefined();
		});

		test('omits the optional fields it is not given', async () => {
			const result = sendAttachmentFetchAPI('test', new File([], 'a.pdf'), { tempId: 'tmp-2' });
			const xhr = lastXhr();
			xhr.respond(201, {});
			await result;

			expect(xhr.body?.get('tempId')).toBe('tmp-2');
			expect(xhr.body?.get('description')).toBeNull();
			expect(xhr.body?.get('replyToId')).toBeNull();
			expect(xhr.body?.get('area')).toBeNull();
		});

		test('resolves with the parsed body of a 201 JSON answer', async () => {
			const result = start();
			lastXhr().respond(201, { id: 'm1' });

			await expect(result).resolves.toEqual({ id: 'm1' });
		});

		test('aborts an attempt with no progress for 60 s and rejects with a TimeoutError', async () => {
			const outcome = outcomeOf(start());
			const xhr = lastXhr();
			await vi.advanceTimersByTimeAsync(UPLOAD_STALL_TIMEOUT_MS - 1);
			expect(xhr.abort).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);

			expect(xhr.abort).toHaveBeenCalledTimes(1);
			expect(await outcome).toMatchObject({ name: 'TimeoutError' });
		});

		test('does not abort a slow but alive upload', async () => {
			const result = start();
			const xhr = lastXhr();

			for (let elapsed = 0; elapsed < 10 * 60_000; elapsed += 50_000) {
				// eslint-disable-next-line no-await-in-loop
				await vi.advanceTimersByTimeAsync(50_000);
				xhr.emitUploadProgress();
			}
			xhr.emitUploadLoad();
			xhr.respond(201, { id: 'm1' });

			expect(xhr.abort).not.toHaveBeenCalled();
			await expect(result).resolves.toEqual({ id: 'm1' });
		});

		test('a download progress event keeps the attempt alive', async () => {
			const outcome = outcomeOf(start());
			const xhr = lastXhr();
			await vi.advanceTimersByTimeAsync(UPLOAD_STALL_TIMEOUT_MS - 1);
			xhr.dispatchEvent(new Event('progress'));
			await vi.advanceTimersByTimeAsync(UPLOAD_STALL_TIMEOUT_MS - 1);
			expect(xhr.abort).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);

			expect(await outcome).toMatchObject({ name: 'TimeoutError' });
		});

		test('rejects with a TimeoutError when the answer does not come after the body is sent', async () => {
			const outcome = outcomeOf(start());
			const xhr = lastXhr();
			await vi.advanceTimersByTimeAsync(UPLOAD_STALL_TIMEOUT_MS - 1);
			xhr.emitUploadLoad();
			await vi.advanceTimersByTimeAsync(UPLOAD_STALL_TIMEOUT_MS - 1);
			expect(xhr.abort).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);

			expect(xhr.abort).toHaveBeenCalledTimes(1);
			expect(await outcome).toMatchObject({ name: 'TimeoutError' });
		});

		test('rejects with the AbortError when the caller signal aborts mid-attempt', async () => {
			const controller = new AbortController();
			const outcome = outcomeOf(start(controller.signal));
			const xhr = lastXhr();

			controller.abort();

			expect(await outcome).toMatchObject({ name: 'AbortError' });
			expect(xhr.abort).toHaveBeenCalledTimes(1);
			expect(vi.getTimerCount()).toBe(0);
		});

		test('rejects with an AbortError without sending when the signal is already aborted', async () => {
			const controller = new AbortController();
			controller.abort();

			await expect(start(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });

			expect(FakeXhr.instances.every((xhr) => xhr.send.mock.calls.length === 0)).toBe(true);
			expect(vi.getTimerCount()).toBe(0);
		});

		test('rejects with a TypeError on a network error', async () => {
			const outcome = outcomeOf(start());
			lastXhr().emitError();

			const error = await outcome;
			expect(error).toBeInstanceOf(TypeError);
			expect(vi.getTimerCount()).toBe(0);
		});

		test('rejects with the status of a non-2xx answer', async () => {
			const result = start();
			lastXhr().respond(413, { message: 'too big' });

			await expect(result).rejects.toMatchObject({ message: 'status ko', status: 413 });
		});

		test('clears its timer and abort listener once the attempt settles', async () => {
			const controller = new AbortController();
			const result = start(controller.signal);
			const xhr = lastXhr();
			xhr.respond(201, {});
			await result;
			controller.abort();

			expect(vi.getTimerCount()).toBe(0);
			expect(xhr.abort).not.toHaveBeenCalled();
		});
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
