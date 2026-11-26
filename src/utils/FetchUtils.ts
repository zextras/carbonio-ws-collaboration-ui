/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';
import { maxSatisfying } from 'semver';

import { charToUnicode } from './textUtils';
import useStore from '../store/Store';
import { AdditionalHeaders, AttachmentUploadFields } from '../types/network/models/attachmentTypes';
import { Version } from '../types/store/SessionTypes';

export const BASE_PATH = '/services/chats/';
export const wscApiVersionHeader = 'X-WSC-API-VERSION';
export const contentTypeHeader = 'Content-Type';

export enum RequestType {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE'
}

export const buildQueryString = (
	params: Record<string, string | number | boolean | undefined | null>
): string => {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null) searchParams.append(key, String(value));
	});
	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
};

const MAX_VERSION_MISMATCH_RETRIES = 3;

const buildHeaders = (): Headers => {
	const headers = new Headers();
	const { queueId, apiVersion } = useStore.getState().session;
	if (queueId) headers.append('queue-id', queueId);
	if (apiVersion) headers.append(wscApiVersionHeader, apiVersion);
	return headers;
};

const handleResponse = async (response: Response): Promise<any> => {
	if (!response.ok) {
		if (response.status === 422) {
			const { session, setApiVersion } = useStore.getState();
			const serverApiVersion = response.headers.get(wscApiVersionHeader) as Version;
			const clientApiVersion = session.apiVersion;
			const negotiatedVersion = serverApiVersion
				? (maxSatisfying(
						session.supportedVersions ?? [],
						`<=${serverApiVersion}`
					) as Version | null)
				: null;
			if (negotiatedVersion && negotiatedVersion !== clientApiVersion) {
				setApiVersion(negotiatedVersion);
				return Promise.reject(new Error('version_mismatch'));
			}
		}
		throw Object.assign(new Error('status ko'), { status: response.status });
	}

	const contentType = response.headers.get(contentTypeHeader);
	if (contentType === 'application/json') return response.json();
	if (includes(contentType, 'image/')) return response.blob();
	return response;
};

export function fetchAPI<T>(
	endpoint: string,
	method: RequestType,
	data?: Record<string, unknown> | Array<Record<string, unknown>>,
	retryCount = 0
): Promise<T> {
	const headers = buildHeaders();
	headers.append(contentTypeHeader, 'application/json');
	return fetch(BASE_PATH + endpoint, {
		method,
		headers,
		body: JSON.stringify(data)
	})
		.then((resp: Response) => handleResponse(resp))
		.catch((err: Error): Promise<any> => {
			if (err.message === 'version_mismatch' && retryCount < MAX_VERSION_MISMATCH_RETRIES) {
				return fetchAPI(endpoint, method, data, retryCount + 1);
			}
			return Promise.reject(err);
		});
}

export const sendFileFetchAPI = (
	endpoint: string,
	method: RequestType,
	file: File,
	signal?: AbortSignal,
	optionalFields?: AdditionalHeaders
): Promise<any> => {
	const formData = new FormData();
	formData.append('file', file, charToUnicode(file.name));
	formData.append('contentLength', file.size.toString());
	optionalFields?.description &&
		formData.append('description', charToUnicode(optionalFields.description));
	optionalFields?.messageId && formData.append('messageId', optionalFields.messageId);
	optionalFields?.replyId && formData.append('replyId', optionalFields?.replyId);
	optionalFields?.area && formData.append('area', optionalFields.area);

	const headers = buildHeaders();

	return fetch(BASE_PATH + endpoint, {
		method,
		headers,
		body: formData,
		signal
	})
		.then((resp: Response) => handleResponse(resp))
		.catch((err: Error) => Promise.reject(err));
};

export const UPLOAD_STALL_TIMEOUT_MS = 60_000;

const parseResponseHeaders = (raw: string): Headers => {
	const headers = new Headers();
	raw.split('\r\n').forEach((line) => {
		const separator = line.indexOf(':');
		if (separator > 0)
			headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
	});
	return headers;
};

/**
 * v2 (WSC-pure) attachment upload: one `POST` multipart, answered by the
 * created `Message`. The file name keeps the unicode escaping, which the
 * backend decodes (an unescaped name fails with a 500). The description goes
 * as-is: the backend stores it as the message text without decoding, and v2
 * clients render the text verbatim (v1 decoded it on receipt). It goes as a
 * part with an explicit UTF-8 charset: a plain string part has no Content-Type,
 * and the backend reads it as US-ASCII, mangling accents and emoji.
 *
 * An attempt that shows no progress for `UPLOAD_STALL_TIMEOUT_MS` (while
 * sending the body or waiting for the answer) rejects with a `TimeoutError`,
 * which the SDK retries with the same tempId, so a slow but alive upload of
 * any size is never cut; an abort of `signal` rejects with an `AbortError`,
 * which gives the upload up.
 */
export function sendAttachmentFetchAPI<T>(
	endpoint: string,
	file: File,
	fields: AttachmentUploadFields,
	signal?: AbortSignal
): Promise<T> {
	const formData = new FormData();
	formData.append('file', file, charToUnicode(file.name));
	formData.append('contentLength', file.size.toString());
	formData.append('tempId', fields.tempId);
	fields.description &&
		formData.append(
			'description',
			new Blob([fields.description], { type: 'text/plain;charset=UTF-8' })
		);
	fields.replyToId && formData.append('replyToId', fields.replyToId);
	fields.area && formData.append('area', fields.area);

	return new Promise<T>((resolve, reject) => {
		const abortError = (): DOMException =>
			new DOMException('The operation was aborted.', 'AbortError');
		if (signal?.aborted) {
			reject(abortError());
			return;
		}

		const xhr = new XMLHttpRequest();
		let settled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const listeners = new AbortController();
		const settle = (action: () => void): void => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			listeners.abort();
			action();
		};
		const armTimer = (): void => {
			clearTimeout(timer);
			timer = setTimeout(
				() =>
					settle(() => {
						xhr.abort();
						reject(new DOMException('Upload attempt stalled', 'TimeoutError'));
					}),
				UPLOAD_STALL_TIMEOUT_MS
			);
		};

		xhr.open(RequestType.POST, BASE_PATH + endpoint);
		xhr.responseType = 'text';
		buildHeaders().forEach((value, name) => xhr.setRequestHeader(name, value));
		const options = { signal: listeners.signal };
		xhr.upload.addEventListener('progress', armTimer, options);
		xhr.upload.addEventListener('load', armTimer, options);
		xhr.addEventListener('progress', armTimer, options);
		xhr.addEventListener(
			'error',
			() => settle(() => reject(new TypeError('Failed to fetch'))),
			options
		);
		xhr.addEventListener(
			'load',
			() =>
				settle(() => {
					// A Response with these statuses must have a null body
					const nullBody = [204, 205, 304].includes(xhr.status);
					Promise.resolve()
						.then(() =>
							handleResponse(
								new Response(nullBody ? null : xhr.response, {
									status: xhr.status,
									statusText: xhr.statusText,
									headers: parseResponseHeaders(xhr.getAllResponseHeaders())
								})
							)
						)
						.then(resolve, reject);
				}),
			options
		);
		signal?.addEventListener(
			'abort',
			() =>
				settle(() => {
					xhr.abort();
					reject(abortError());
				}),
			options
		);
		armTimer();
		xhr.send(formData);
	});
}

export const uploadFileFetchAPI = (
	endpoint: string,
	requestType: RequestType,
	file: File,
	signal?: AbortSignal,
	optionalFields?: AdditionalHeaders
): Promise<any> =>
	new Promise<any>((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('load', () => {
			// Headers have to be encoded in unicode to be sent
			const headers = buildHeaders();
			headers.append('fileName', charToUnicode(file.name));
			headers.append('mimeType', file.type || 'application/octet-stream');
			if (optionalFields) {
				optionalFields.description &&
					headers.append('description', charToUnicode(optionalFields.description));
				optionalFields.messageId && headers.append('messageId', optionalFields.messageId);
				optionalFields.replyId && headers.append('replyId', optionalFields.replyId);
				optionalFields.area && headers.append('area', optionalFields.area);
			}

			fetch(BASE_PATH + endpoint, {
				method: requestType,
				headers,
				body: reader.result,
				signal
			})
				.then((resp: Response) => {
					if (!resp.ok) reject(new Error());
					const contentType = resp.headers.get(contentTypeHeader);
					if (includes(contentType, 'image/')) resolve(resp.blob());
					else resolve(resp);
				})
				.catch((err: Error) => reject(err));
		});
		reader.addEventListener('error', () => reject(new Error()));
		reader.readAsArrayBuffer(file);
	});
