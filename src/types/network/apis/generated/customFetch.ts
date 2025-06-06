/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

export const BASE_PATH = '/services/chats/';

export const fetchWrapper = async <T>(
	endpoint: string,
	options: {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
		headers?: HeadersInit;
		body?: BodyInit | null;
	}
): Promise<T> => {
	const URL = BASE_PATH + endpoint;
	const upHeaders = new Headers(options.headers);
	upHeaders.append('Content-Type', 'application/json');

	// Add sessionId to headers only id it is already defined
	// TODO
	// const { queueId } = useStore.getState().session.queueId;
	const queueId = 'TODO:IMPLEMENT';
	if (queueId) {
		upHeaders.append('queue-id', queueId);
	}

	return fetch(URL, {
		method: options.method,
		headers: upHeaders,
		body: options.body
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

export default fetchWrapper;
