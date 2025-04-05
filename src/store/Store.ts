/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useActiveConversationsSlice } from './slices/ActiveConversationsSlice';
import { useActiveMeetingSlice } from './slices/ActiveMeetingSlice';
import { useConnectionsStoreSlice } from './slices/ConnectionStoreSlice';
import { useMeetingsStoreSlice } from './slices/MeetingsStoreSlice';
import { useRoomsStoreSlice } from './slices/RoomsStoreSlice';
import { useSessionStoreSlice } from './slices/SessionStoreSlice';
import { useChatDataStoreSlice } from './slices/useChatDataStoreSlice';
import { useUsersStoreSlice } from './slices/UsersStoreSlice';
import { RootStore } from '../types/store/StoreTypes';

const useStore = create<RootStore>()(
	devtools(
		(set, get, api): RootStore => ({
			...useSessionStoreSlice(set, get, api),
			...useUsersStoreSlice(set, get, api),
			...useRoomsStoreSlice(set, get, api),
			...useActiveConversationsSlice(set, get, api),
			...useChatDataStoreSlice(set, get, api),
			...useConnectionsStoreSlice(set, get, api),
			...useMeetingsStoreSlice(set, get, api),
			...useActiveMeetingSlice(set, get, api)
		}),
		{ name: 'carbonio-ws-collaboration-ui' }
	)
);

export default useStore;
