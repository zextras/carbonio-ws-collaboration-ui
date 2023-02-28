/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce, find, forEach } from 'lodash';

import useStore from '../../store/Store';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import IUsersApi from '../../types/network/apis/IUsersApi';
import {
	ChangeUserPictureResponse,
	DeleteUserPictureResponse,
	GetUserPictureResponse,
	GetUserResponse
} from '../../types/network/responses/usersResponses';
import { CapabilityType } from '../../types/store/SessionTypes';
import BaseAPI from './BaseAPI';

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

	public getURLUserPicture = (userId: string): string =>
		`${window.document.location.origin}/services/chats/users/${userId}/picture`;

	public getUserPicture(userId: string): Promise<GetUserPictureResponse> {
		return this.fetchAPI(`users/${userId}/picture`, RequestType.GET);
	}

	public changeUserPicture(userId: string, file: File): Promise<ChangeUserPictureResponse> {
		return new Promise<ChangeUserPictureResponse>((resolve, reject) => {
			if (file.size > +CapabilityType.MAX_USER_IMAGE_SIZE) {
				reject(new Error('File too large'));
			} else {
				this.uploadFileFetchAPI(`users/${userId}/picture`, RequestType.PUT, file)
					.then((resp: ChangeUserPictureResponse) => resolve(resp))
					.catch((error) => reject(error));
			}
		});
	}

	public deleteUserPicture(userId: string): Promise<DeleteUserPictureResponse> {
		return this.fetchAPI(`users/${userId}/picture`, RequestType.DELETE);
	}

	private unknownUsers: string[] = [];

	// TODO improve
	public getDebouncedUser(userId: string): void {
		if (!find(this.unknownUsers, (id) => id === userId)) this.unknownUsers.push(userId);
		debounce(() => {
			forEach(this.unknownUsers, (id) => this.getUser(id));
			this.unknownUsers = [];
		}, 1000)();
	}
}

export default UsersApi.getInstance();
