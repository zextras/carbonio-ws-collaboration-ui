/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { concat, debounce, difference, find, forEach, map, size, slice } from 'lodash';
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

	private unknownUsers: { [userId: string]: number } = {};

	private getRequestedUsers(): void {
		const requestingUsers = slice(this.usersToRequest, 0, 10);
		this.usersToRequest = difference(this.usersToRequest, requestingUsers);
		this.requestingUsers = concat(this.requestingUsers, requestingUsers);

		UsersApi.getUsers(requestingUsers)
			.then((response) => {
				const responseUsers = map(response, (user) => user.id);
				const unknownUsers = difference(requestingUsers, responseUsers);
				forEach(unknownUsers, (userId) => {
					if (!this.unknownUsers[userId]) {
						this.unknownUsers[userId] = 1;
					} else {
						this.unknownUsers[userId] += 1;
					}
				});
			})
			.finally(() => {
				this.requestingUsers = difference(this.requestingUsers, requestingUsers);
			});
	}

	private debouncedUserGetter = debounce(this.getRequestedUsers, 600);

	// Create groups of 10 users to request
	public getDebouncedUser(userId: string | undefined): void {
		if (
			userId &&
			!useStore.getState().users[userId]?.email &&
			validate(userId) &&
			!find(this.usersToRequest, (id) => id === userId) &&
			!find(this.requestingUsers, (id) => id === userId) &&
			!(this.unknownUsers[userId] > 1)
		) {
			this.usersToRequest.push(userId);

			// If there are less than 10 users to request, wait 0.6 second before requesting them
			if (size(this.usersToRequest) < 10) {
				this.debouncedUserGetter();
			} else {
				this.debouncedUserGetter.flush();
			}
		}
	}
}

export default UserDataRetriever.getInstance();
