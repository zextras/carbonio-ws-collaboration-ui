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
import { useFasteningMessagesSlice } from './slices/FasteningMessagesSlice';
import { useMarkersStoreSlice } from './slices/MarkersStoreSlice';
import { useMeetingsStoreSlice } from './slices/MeetingsStoreSlice';
import { useMessagesStoreSlice } from './slices/MessagesStoreSlice';
import { useRoomsStoreSlice } from './slices/RoomsStoreSlice';
import { useSessionStoreSlice } from './slices/SessionStoreSlice';
import { useUnreadsCountStoreSlice } from './slices/UnreadsCounterStoreSlice';
import { useUsersStoreSlice } from './slices/UsersStoreSlice';
import { RootStore } from '../types/store/StoreTypes';

const useStore = create<RootStore>()(
	devtools(
		(...set) => ({
			...useUsersStoreSlice(...set),
			...useRoomsStoreSlice(...set),
			...useMessagesStoreSlice(...set),
			...useSessionStoreSlice(...set),
			...useMarkersStoreSlice(...set),
			...useActiveConversationsSlice(...set),
			...useConnectionsStoreSlice(...set),
			...useUnreadsCountStoreSlice(...set),
			...useFasteningMessagesSlice(...set),
			...useMeetingsStoreSlice(...set),
			...useActiveMeetingSlice(...set)
		}),
		{ name: 'carbonio-ws-collaboration-ui' }
	)
);

export default useStore;
