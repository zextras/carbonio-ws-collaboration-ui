/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

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

/**
 * v2 (WSC-pure) attachment upload: one `POST` multipart, answered by the
 * created `Message`. The file name keeps the unicode escaping, which the
 * backend decodes (an unescaped name fails with a 500). The description goes
 * as-is: the backend stores it as the message text without decoding, and v2
 * clients render the text verbatim (v1 decoded it on receipt). It goes as a
 * part with an explicit UTF-8 charset: a plain string part has no Content-Type,
 * and the backend reads it as US-ASCII, mangling accents and emoji.
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

	return fetch(BASE_PATH + endpoint, {
		method: RequestType.POST,
		headers: buildHeaders(),
		body: formData,
		signal
	}).then((resp: Response) => handleResponse(resp));
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
