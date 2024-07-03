/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// this mocks ONLY getWorkerUrl
jest.mock('../../utils/MeetingsUtils', () => {
	const actualUtils = jest.requireActual('../../utils/MeetingsUtils');
	return {
		...actualUtils,
		getWorkerUrl: jest.fn()
	};
});
