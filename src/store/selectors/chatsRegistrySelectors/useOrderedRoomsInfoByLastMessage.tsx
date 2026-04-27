/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { filter, isEqual, orderBy } from 'lodash';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { FilteredConversation } from '../../../chats/components/secondaryBar/SecondaryBarView';
import { RoomType } from '../../../types/store/RoomTypes';
import useStore from '../../Store';

export const useOrderedRoomsInfoByLastMessage = (): FilteredConversation[] => {
	const roomsData = useStoreWithEqualityFn(
		useStore,
		(state) => {
			const filteredRooms = filter(
				state.rooms,
				(room) => room.type === RoomType.GROUP || room.type === RoomType.ONE_TO_ONE
			);

			return filteredRooms.map((room) => {
				const registry = state.chatsRegistry[room.id];
				const lastMessageDate = registry?.lastMessage?.date ?? 0;
				// lastMessageForInbox is set when the user is viewing historical messages and a new
				// message arrives — use it as a candidate so the inbox sort reflects the real latest
				// activity even when hasMoreAfter === true.
				const lastMessageForInboxDate = registry?.lastMessageForInbox?.date ?? 0;
				const draftMessageDate = state.activeConversations[room.id]?.draftMessage?.date ?? 0;

				return {
					roomId: room.id,
					name: room.name || '',
					roomType: room.type,
					members: room.members,
					lastMessageTimestamp: Math.max(lastMessageDate, lastMessageForInboxDate, draftMessageDate)
				};
			});
		},
		isEqual
	);

	return useMemo(() => {
		const ordered = orderBy(roomsData, ['lastMessageTimestamp'], ['desc']);
		return ordered.map((item) => ({
			roomId: item.roomId,
			name: item.name,
			roomType: item.roomType,
			members: item.members
		}));
	}, [roomsData]);
};
