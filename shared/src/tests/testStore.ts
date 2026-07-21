/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
	useActiveConversationsSlice,
	useActiveMeetingSlice,
	useChatsRegistryStoreSlice,
	useConnectionsStoreSlice,
	useMediaGalleryStoreSlice,
	useMeetingsStoreSlice,
	usePreviewNavigationStoreSlice,
	useRoomsStoreSlice,
	useSessionStoreSlice,
	useUsersStoreSlice
} from '../store';
import { RootStore } from '../types/store/StoreTypes';

const useStore = create<RootStore>()(
	devtools(
		(set, get, api): RootStore => ({
			...useSessionStoreSlice(set, get, api),
			...useUsersStoreSlice(set, get, api),
			...useConnectionsStoreSlice(set, get, api),
			...useRoomsStoreSlice(set, get, api),
			...useChatsRegistryStoreSlice(set, get, api),
			...useActiveConversationsSlice(set, get, api),
			...useMeetingsStoreSlice(set, get, api),
			...useActiveMeetingSlice(set, get, api),
			...useMediaGalleryStoreSlice(set, get, api),
			...usePreviewNavigationStoreSlice(set, get, api)
		}),
		{ name: 'wsc-store' }
	)
);

export default useStore;
