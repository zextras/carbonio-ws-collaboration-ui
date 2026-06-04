/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RootStore } from '../../types/store/StoreTypes';
import UserDataRetriever from '../../utils/UserDataRetriever';

export const getUserName = (store: RootStore, id: string): string => {
	UserDataRetriever.getDebouncedUser(id);
	return store.users[id]?.name || store.users[id]?.email || '';
};
