/* eslint-disable prefer-destructuring */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';

import useStore from '../../store/Store';
import IBaseAPI, { RequestType } from '../../types/network/apis/IBaseAPI';

export default abstract class BaseAPI implements IBaseAPI {
	private readonly url: string = '/services/chats/';

	public fetchAPI(
		endpoint: string,
		method: RequestType,
		data?: Record<string, unknown>
	): Promise<any> {
		const URL = this.url + endpoint;
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		// Add sessionId to headers only id it is already defined
		const sessionId = useStore.getState().session.sessionId;
		if (sessionId) {
			headers.append('session-id', sessionId);
		}

		return fetch(URL, {
			method,
			headers,
			body: JSON.stringify(data)
		})
			.then((resp: Response) => {
				if (resp.ok) return resp;
				return Promise.reject(resp);
			})
			.then((resp: Response) => {
				const contentType = resp.headers.get('content-type');
				if (contentType === 'application/json') return resp.json();
				if (includes(contentType, 'image/')) return resp.blob();
				return resp;
			})
			.catch((err: Error) => Promise.reject(err));
	}

	uploadFileFetchAPI(endpoint: string, file: File, requestType?: RequestType): Promise<any> {
		// TODO encode filename
		return new Promise<any>((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				const headers = new Headers();
				headers.append(
					'X-Content-Disposition',
					`fileName=${btoa(encodeURIComponent(file.name))}; mimeType=${file.type}`
				);
				// Add sessionId to headers only if it is already defined
				const sessionId = useStore.getState().session.sessionId;
				if (sessionId) {
					headers.append('session-id', sessionId);
				}
				fetch(this.url + endpoint, {
					method: requestType || RequestType.PUT,
					headers,
					body: reader.result
				})
					.then((resp: Response) => {
						const contentType = resp.headers.get('content-type');
						if (includes(contentType, 'image/')) resolve(resp.blob());
						else resolve(resp);
					})
					.catch((err: Error) => {
						console.error(err);
						reject(err);
					});
			});
			reader.addEventListener('error', (error) => {
				console.error(error);
				reject(error);
			});
			reader.readAsArrayBuffer(file);
		});
	}
}
