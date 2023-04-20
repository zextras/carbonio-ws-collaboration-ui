/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	ChangeUserPictureResponse,
	DeleteUserPictureResponse,
	GetUserPictureResponse,
	GetUserResponse,
	GetUsersResponse
} from '../responses/usersResponses';

interface IUsersApi {
	getUser(userId: string): Promise<GetUserResponse>;
	getUsers(userId: string[]): Promise<GetUsersResponse>;
	getURLUserPicture(userId: string): string;
	getUserPicture(userId: string): Promise<GetUserPictureResponse>;
	changeUserPicture(userId: string, file: File): Promise<ChangeUserPictureResponse>;
	deleteUserPicture(userId: string): Promise<DeleteUserPictureResponse>;
	getDebouncedUser(userId: string): void;
	clearUserCache(): void;
}

export default IUsersApi;
