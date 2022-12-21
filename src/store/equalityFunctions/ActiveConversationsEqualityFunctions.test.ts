/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { messageWhereScrollIsStoppedEqualityFn } from './ActiveConversationsEqualityFunctions';

describe('Testing activeConversationsEqualityFunctions', () => {
	it('tests messageWhereScrollIsStoppedEqualityFn changes', function () {
		const result = messageWhereScrollIsStoppedEqualityFn(undefined, '4571vcxv54gd5f4');
		expect(result).toBeFalsy();
	});

	it('tests messageWhereScrollIsStoppedEqualityFn equality', function () {
		const result = messageWhereScrollIsStoppedEqualityFn('4571vcxv54gd5f4', '4571vcxv54gd5f4');
		expect(result).toBeTruthy();
	});
});
