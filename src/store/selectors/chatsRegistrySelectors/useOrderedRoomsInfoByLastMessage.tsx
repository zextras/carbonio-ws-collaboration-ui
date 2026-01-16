/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, forEach, orderBy } from 'lodash';

import { FilteredConversation } from '../../../chats/components/secondaryBar/SecondaryBarView';
import { RoomType } from '../../../types/store/RoomTypes';
import useStore from '../../Store';

export const useOrderedRoomsInfoByLastMessage = (): FilteredConversation[] => {
	const { rooms, chatsRegistry, activeConversations } = useStore((store) => store);
	const filteredRooms = filter(
		rooms,
		(room) => room.type === RoomType.GROUP || room.type === RoomType.ONE_TO_ONE
	);
	const listOfConvLastMessage: FilteredConversation[] = [];
	forEach(filteredRooms, (room) => {
		const registry = chatsRegistry[room.id];
		const messages = registry?.messages;
		const lastMessageFromArray = messages?.[messages.length - 1]?.date ?? 0;
		// Use lastMessageForInbox if it's more recent (received via SSE while viewing historical page)
		const lastMessageForInbox = registry?.lastMessageForInbox?.date ?? 0;
		const lastMessageDate = Math.max(lastMessageFromArray, lastMessageForInbox);
		const draftMessageDate = activeConversations[room.id]?.draftMessage?.date ?? 0;
		listOfConvLastMessage.push({
			roomId: room.id,
			name: room.name ?? '',
			roomType: room.type,
			lastMessageTimestamp: draftMessageDate > lastMessageDate ? draftMessageDate : lastMessageDate,
			members: room.members ?? []
		});
	});
	return orderBy(listOfConvLastMessage, ['lastMessageTimestamp'], ['desc']);
};
