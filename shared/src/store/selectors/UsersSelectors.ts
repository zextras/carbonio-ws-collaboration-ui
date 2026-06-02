/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';

import { RootStore } from '../../types/store/StoreTypes';
import { UserType } from '../../types/store/UserTypes';
import UserDataRetriever from '../../utils/UserDataRetriever';

export const getUserName = (store: RootStore, id: string): string => {
	UserDataRetriever.getDebouncedUser(id);
	if (store.users[id]?.type === UserType.ANONYMOUS) {
		return t('status.Anonymous', 'Anonymous user');
	}
	return store.users[id]?.name || store.users[id]?.email || '';
};
