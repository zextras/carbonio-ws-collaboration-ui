/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useActiveConversationsSlice } from '../store/slices/ActiveConversationsSlice';
import { useActiveMeetingSlice } from '../store/slices/ActiveMeetingSlice';
import { useChatsRegistryStoreSlice } from '../store/slices/ChatsRegistryStoreSlice';
import { useConnectionsStoreSlice } from '../store/slices/ConnectionStoreSlice';
import { useMediaGalleryStoreSlice } from '../store/slices/MediaGalleryStoreSlice';
import { useMeetingsStoreSlice } from '../store/slices/MeetingsStoreSlice';
import { usePreviewNavigationStoreSlice } from '../store/slices/PreviewNavigationStoreSlice';
import { useRoomsStoreSlice } from '../store/slices/RoomsStoreSlice';
import { useSessionStoreSlice } from '../store/slices/SessionStoreSlice';
import { useUsersStoreSlice } from '../store/slices/UsersStoreSlice';
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
