/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import create, { SetState } from 'zustand';
import { devtools } from 'zustand/middleware';

import { RootStore } from '../types/store/StoreTypes';
import { useActiveConversationsSlice } from './slices/ActiveConversationsSlice';
import { useConnectionsStoreSlice } from './slices/ConnectionStoreSlice';
import { useMarkersStoreSlice } from './slices/MarkersStoreSlice';
import { useMessagesStoreSlice } from './slices/MessagesStoreSlice';
import { useRoomsStoreSlice } from './slices/RoomsStoreSlice';
import { useSessionStoreSlice } from './slices/SessionStoreSlice';
import { useUnreadsCountStoreSlice } from './slices/UnreadsCounterStoreSlice';
import { useUsersStoreSlice } from './slices/UsersStoreSlice';

const useStore = create<RootStore>(
	devtools(
		(set: SetState<any>) => ({
			...useUsersStoreSlice(set),
			...useRoomsStoreSlice(set),
			...useMessagesStoreSlice(set),
			...useSessionStoreSlice(set),
			...useMarkersStoreSlice(set),
			...useActiveConversationsSlice(set),
			...useConnectionsStoreSlice(set),
			...useUnreadsCountStoreSlice(set)
		}),
		{ name: 'carbonio-chats-ui' }
	)
);

export default useStore;
