/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as uuid from 'uuid';

import UserDataRetriever from './UserDataRetriever';

beforeEach(() => {
	UserDataRetriever.clearUserCache();
});

describe('UserDataRetriever tests', () => {
	test('getDebouncedUser is correctly used with few users', async () => {
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		// Finish debounced function
		jest.runAllTimers();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	test('getDebouncedUser is correctly used with a lot of users', async () => {
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		// Second group of users
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());

		// Finish debounced function
		jest.runAllTimers();

		expect(global.fetch).toHaveBeenCalledTimes(2);
	});

	test('getDebouncedUser is correctly used with a duplicated userId', async () => {
		const duplicateUuid = uuid.v6();
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(duplicateUuid);
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(uuid.v6());
		UserDataRetriever.getDebouncedUser(duplicateUuid); // Duplicated id
		// Finish debounced function
		jest.runAllTimers();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});
});
