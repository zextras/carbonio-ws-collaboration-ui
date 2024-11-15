/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

import { charToUnicode } from './textUtils';
import useStore from '../store/Store';
import { RequestType } from '../types/network/apis/IBaseAPI';
import { AdditionalHeaders } from '../types/network/models/attachmentTypes';

export const BASE_PATH = '/services/chats/';

export const mimeTypeToAppend = (mimeTypeToCheck: string | undefined): string =>
	mimeTypeToCheck !== undefined && mimeTypeToCheck.length !== 0
		? mimeTypeToCheck
		: 'application/octet-stream';

export const fetchAPI = (
	endpoint: string,
	method: RequestType,
	data?: Record<string, unknown> | Array<Record<string, unknown>>
): Promise<any> => {
	const URL = BASE_PATH + endpoint;
	const headers = new Headers();
	headers.append('Content-Type', 'application/json');

	// Add sessionId to headers only id it is already defined
	const { sessionId } = useStore.getState().session;
	if (sessionId) {
		headers.append('queue-id', sessionId);
	}

	return fetch(URL, {
		method,
		headers,
		body: JSON.stringify(data)
	})
		.then((resp: Response) => {
			if (resp.ok) return resp;
			return Promise.reject(new Error('status ko'));
		})
		.then((resp: Response) => {
			const contentType = resp.headers.get('content-type');
			if (contentType === 'application/json') return resp.json();
			if (includes(contentType, 'image/')) return resp.blob();
			return resp;
		})
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
			const headers = new Headers();
			headers.append('fileName', charToUnicode(file.name));
			headers.append('mimeType', mimeTypeToAppend(file.type));
			if (optionalFields) {
				optionalFields.description &&
					headers.append('description', charToUnicode(optionalFields.description));
				optionalFields.messageId && headers.append('messageId', optionalFields.messageId);
				optionalFields.replyId && headers.append('replyId', optionalFields.replyId);
				optionalFields.area && headers.append('area', optionalFields.area);
			}

			// Add sessionId to headers only if it is already defined
			const { sessionId } = useStore.getState().session;
			if (sessionId) {
				headers.append('session-id', sessionId);
			}
			fetch(BASE_PATH + endpoint, {
				method: requestType,
				headers,
				body: reader.result,
				signal
			})
				.then((resp: Response) => {
					if (resp.ok) return resp;
					return Promise.reject(new Error());
				})
				.then((resp: Response) => {
					const contentType = resp.headers.get('content-type');
					if (includes(contentType, 'image/')) {
						resolve(resp.blob());
					} else {
						resolve(resp);
					}
				})
				.catch((err: Error) => {
					reject(err);
				});
		});
		reader.addEventListener('error', (error) => {
			console.error(error);
			reject(error);
		});
		reader.readAsArrayBuffer(file);
	});
