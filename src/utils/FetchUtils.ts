/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

import { charToUnicode } from './textUtils';
import useStore from '../store/Store';
import { AdditionalHeaders } from '../types/network/models/attachmentTypes';
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
			if (
				!!serverApiVersion &&
				serverApiVersion !== clientApiVersion &&
				session.supportedVersions?.includes(serverApiVersion)
			) {
				setApiVersion(serverApiVersion as Version);
				return Promise.reject(new Error('version_mismatch'));
			}
		}
		return Promise.reject(new Error('status ko'));
	}

	const contentType = response.headers.get(contentTypeHeader);
	if (contentType === 'application/json') return response.json();
	if (includes(contentType, 'image/')) return response.blob();
	return response;
};

/**
 * Lightweight authenticated probe used at connect-time to negotiate which
 * messaging backend the client is talking to.
 *
 * Both backends expose `GET /rooms` (returns 200) and stamp the
 * `X-WSC-API-VERSION` header on EVERY response — common-socket reports
 * `>= 2.0.0`, devel/MongooseIM reports `1.6.x`. Because `fetchAPI` discards
 * the `Response` object (it resolves to the parsed body), we do a raw `fetch`
 * here so we can read the response header directly.
 *
 * @param endpoint chats endpoint exposed by both backends (defaults to `rooms`)
 * @returns the value of `X-WSC-API-VERSION`, or `null` if the header is absent
 *          or the request fails (caller treats this as a safe MongooseIM fallback)
 */
export async function probeBackendApiVersion(endpoint = 'rooms'): Promise<string | null> {
	try {
		const response = await fetch(BASE_PATH + endpoint, {
			method: RequestType.GET,
			headers: buildHeaders()
		});
		// The header is stamped on every response, including errors, so we read
		// it regardless of response.ok.
		return response.headers.get(wscApiVersionHeader);
	} catch {
		return null;
	}
}

export function fetchAPI<T>(
	endpoint: string,
	method: RequestType,
	data?: Record<string, unknown> | Array<Record<string, unknown>>,
	retryCount = 0
): Promise<T> {
	const headers = buildHeaders();
	// Only set Content-Type and body if data is provided
	const hasBody = data !== undefined;
	if (hasBody) {
		headers.append(contentTypeHeader, 'application/json');
	}
	return fetch(BASE_PATH + endpoint, {
		method,
		headers,
		body: hasBody ? JSON.stringify(data) : undefined
	})
		.then((resp: Response) => handleResponse(resp) as Promise<T>)
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
	optionalFields?.description && formData.append('description', optionalFields.description);
	optionalFields?.messageId && formData.append('messageId', optionalFields.messageId);
	optionalFields?.replyId && formData.append('replyId', optionalFields?.replyId);
	optionalFields?.area && formData.append('area', optionalFields.area);
	optionalFields?.text && formData.append('text', optionalFields.text);
	optionalFields?.replyToId && formData.append('replyToId', optionalFields.replyToId);
	optionalFields?.tempId && formData.append('tempId', optionalFields.tempId);

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
				optionalFields.tempId && headers.append('X-Temp-Id', optionalFields.tempId);
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
