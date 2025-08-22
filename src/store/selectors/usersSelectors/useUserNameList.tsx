/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import UserDataRetriever from '../../../utils/UserDataRetriever';
import useStore from '../../Store';
import { getUsersSelector } from '../UsersSelectors';

export const useUserNameList = (ids: string[]): string[] => {
	const users = useStore(getUsersSelector);
	return ids.map((id) => {
		UserDataRetriever.getDebouncedUser(id);
		return users[id]?.name || users[id]?.email || '';
	});
};
