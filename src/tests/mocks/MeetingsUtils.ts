/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// this mocks ONLY getWorkerUrl
vi.mock('../../utils/MeetingsUtils', async () => {
	const actualUtils = await vi.importActual('../../utils/MeetingsUtils');
	return {
		...actualUtils,
		getWorkerUrl: vi.fn()
	};
});
