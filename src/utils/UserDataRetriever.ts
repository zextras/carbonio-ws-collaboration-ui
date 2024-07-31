/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { concat, debounce, difference, find, size, slice } from 'lodash';
import { validate } from 'uuid';

import { UsersApi } from '../network';
import useStore from '../store/Store';

class UserDataRetriever {
	private static instance: UserDataRetriever;

	public static getInstance(): UserDataRetriever {
		if (!UserDataRetriever.instance) {
			UserDataRetriever.instance = new UserDataRetriever();
		}
		return UserDataRetriever.instance;
	}

	private usersToRequest: string[] = [];

	private requestingUsers: string[] = [];

	public clearUserCache(): void {
		this.usersToRequest = [];
		this.requestingUsers = [];
	}

	private getRequestedUsers(): void {
		const requestingUsers = slice(this.usersToRequest, 0, 10);
		this.usersToRequest = difference(this.usersToRequest, requestingUsers);
		this.requestingUsers = concat(this.requestingUsers, requestingUsers);

		UsersApi.getUsers(requestingUsers).finally(() => {
			this.requestingUsers = difference(this.requestingUsers, requestingUsers);
		});
	}

	private debouncedUserGetter = debounce(this.getRequestedUsers, 600);

	// Create groups of 10 users after 1 second of delay from the last call
	public getDebouncedUser(userId: string | undefined): void {
		if (!userId || useStore.getState().users[userId]?.email || !validate(userId)) return;

		// If the user is already being requested, don't request it again
		if (
			!find(this.usersToRequest, (id) => id === userId) &&
			!find(this.requestingUsers, (id) => id === userId)
		) {
			this.usersToRequest.push(userId);

			// If there are less than 10 users to request, wait 1 second before requesting them (wait if there are other calls)
			if (size(this.usersToRequest) < 10) {
				this.debouncedUserGetter();
			} else {
				// If there are more than 10 users to request, request them immediately
				this.debouncedUserGetter.flush();
			}
		}
	}
}

export default UserDataRetriever.getInstance();
