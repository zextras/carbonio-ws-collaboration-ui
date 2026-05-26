/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { RootStore } from '../types/store/StoreTypes';
import {
	useActiveConversationsSlice,
	useConnectionsStoreSlice,
	useSessionStoreSlice,
	useUsersStoreSlice,
	useRoomsStoreSlice,
	useChatsRegistryStoreSlice,
	useMeetingsStoreSlice,
	useActiveMeetingSlice,
	useMediaGalleryStoreSlice,
	usePreviewNavigationStoreSlice
} from 'wsc-shared';

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
