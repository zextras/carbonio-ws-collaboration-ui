/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../store/Store';

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('sessionId', 'User Name');
});
describe('Test useFilterRoomsOnInput custom hook', () => {
	test('', () => {
		expect(true).toEqual(true);
	});
});
