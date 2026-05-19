/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { useActiveConversationsSlice } from './slices/ActiveConversationsSlice';
import { useActiveMeetingSlice } from './slices/ActiveMeetingSlice';
import { useChatsRegistryStoreSlice } from './slices/ChatsRegistryStoreSlice';
import { useConnectionsStoreSlice } from './slices/ConnectionStoreSlice';
import { useMediaGalleryStoreSlice } from './slices/MediaGalleryStoreSlice';
import { useMeetingsStoreSlice } from './slices/MeetingsStoreSlice';
import { usePreviewNavigationStoreSlice } from './slices/PreviewNavigationStoreSlice';
import { useRoomsStoreSlice } from './slices/RoomsStoreSlice';
import { useSessionStoreSlice } from './slices/SessionStoreSlice';
import { useUsersStoreSlice } from './slices/UsersStoreSlice';
import { RootStore } from '../types/store/StoreTypes';

const STORAGE_KEY = 'carbonio-ws-collaboration-storage';
const TTL = 2 * 24 * 60 * 60 * 1000;
const checkAndCleanExpiredStorage = (): void => {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		const data = JSON.parse(stored);
		const persistedAt = data?.state?.session?._persistedAt || 0;
		if (Date.now() - persistedAt > TTL) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
};

checkAndCleanExpiredStorage();

const useStore = create<RootStore>()(
	devtools(
		persist(
			(set, get, api): RootStore => ({
				...useSessionStoreSlice(set, get, api),
				...useUsersStoreSlice(set, get, api),
				...useRoomsStoreSlice(set, get, api),
				...useActiveConversationsSlice(set, get, api),
				...useChatsRegistryStoreSlice(set, get, api),
				...useConnectionsStoreSlice(set, get, api),
				...useMeetingsStoreSlice(set, get, api),
				...useActiveMeetingSlice(set, get, api),
				...useMediaGalleryStoreSlice(set, get, api),
				...usePreviewNavigationStoreSlice(set, get, api)
			}),
			{
				name: STORAGE_KEY,
				partialize: (state) => ({
					session: {
						_persistedAt: state.session._persistedAt
					},
					users: Object.fromEntries(
						Object.entries(state.users).map(([userId, user]) => {
							const { online, lastActivity, ...persistentUser } = user;
							return [userId, persistentUser];
						})
					),
					rooms: state.rooms,
					chatsRegistry: Object.fromEntries(
						Object.entries(state.chatsRegistry).map(([roomId, chat]) => [
							roomId,
							{
								unread: 0,
								inboxMessageId: chat.inboxMessageId,
								lastMessage: chat.lastMessage,
								messages: [],
								fastenings: {},
								markers: {},
								searchResults: [],
								backfillQueue: []
							}
						])
					)
				})
			}
		),
		{
			name: 'carbonio-ws-collaboration-ui'
		}
	)
);

export default useStore;
