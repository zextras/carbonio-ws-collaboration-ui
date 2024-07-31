/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, join, map } from 'lodash';

import BaseAPI from './BaseAPI';
import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IUsersApi from '../../types/network/apis/IUsersApi';
import {
	ChangeUserPictureResponse,
	DeleteUserPictureResponse,
	GetUserPictureResponse,
	GetUserResponse,
	GetUsersResponse
} from '../../types/network/responses/usersResponses';

class UsersApi extends BaseAPI implements IUsersApi {
	// Singleton design pattern
	private static instance: IUsersApi;

	public static getInstance(): IUsersApi {
		if (!UsersApi.instance) {
			UsersApi.instance = new UsersApi();
		}
		return UsersApi.instance;
	}

	public getUser(userId: string): Promise<GetUserResponse> {
		const { setUserInfo } = useStore.getState();
		return this.fetchAPI(`users/${userId}`, RequestType.GET).then((resp: GetUserResponse) => {
			setUserInfo(resp);
			return resp;
		});
	}

	public getUsers(userIds: string[]): Promise<GetUsersResponse> {
		const { setUserInfo } = useStore.getState();
		const ids = map(userIds, (id) => `userIds=${id}`);
		return this.fetchAPI(`users?${join(ids, '&')}`, RequestType.GET).then(
			(resp: GetUsersResponse) => {
				forEach(resp, (user) => setUserInfo(user));
				return resp;
			}
		);
	}

	public getURLUserPicture = (userId: string): string =>
		`${window.document.location.origin}/services/chats/users/${userId}/picture`;

	public getUserPicture(userId: string): Promise<GetUserPictureResponse> {
		return this.fetchAPI(`users/${userId}/picture`, RequestType.GET);
	}

	public changeUserPicture(userId: string, file: File): Promise<ChangeUserPictureResponse> {
		return new Promise<ChangeUserPictureResponse>((resolve, reject) => {
			const sizeLimit = useStore.getState().session.capabilities?.maxUserImageSizeInKb;
			if (sizeLimit && file.size > sizeLimit * 1024) {
				reject(new Error('File too large'));
			} else {
				this.uploadFileFetchAPI(`users/${userId}/picture`, RequestType.PUT, file)
					.then((resp: ChangeUserPictureResponse) => resolve(resp))
					.catch((error) => reject(new Error(error)));
			}
		});
	}

	public deleteUserPicture(userId: string): Promise<DeleteUserPictureResponse> {
		return this.fetchAPI(`users/${userId}/picture`, RequestType.DELETE);
	}
}

export default UsersApi.getInstance();
