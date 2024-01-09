/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, size } from 'lodash';

import { UsersMap } from '../../types/store/UserTypes';

export const usersNameListEqualityFn = (oldState: UsersMap, newState: UsersMap): boolean => {
	if (size(oldState) === size(newState)) {
		// eslint-disable-next-line consistent-return
		forEach(oldState, (user) => {
			if (user.name !== newState[user.id]?.name) {
				return false;
			}
		});
		return true;
	}
	return false;
};
