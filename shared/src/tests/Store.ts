/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useSessionStoreSlice } from '../store/slices/SessionStoreSlice';
import { useUsersStoreSlice } from '../store/slices/UsersStoreSlice';
import { RootStore } from '../types/store/StoreTypes';

const useStore = create<RootStore>()(
	devtools(
		(set, get, api): RootStore => ({
			...useSessionStoreSlice(set, get, api),
			...useUsersStoreSlice(set, get, api)
		}),
		{ name: 'wsc-shared' }
	)
);

export default useStore;
