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
	const { rooms, chatsRegistry } = useStore((store) => store);
	const filteredRooms = filter(
		rooms,
		(room) => room.type === RoomType.GROUP || room.type === RoomType.ONE_TO_ONE
	);
	const listOfConvLastMessage: FilteredConversation[] = [];
	forEach(filteredRooms, (room) => {
		const messages = chatsRegistry[room.id]?.messages;
		const lastMessage = messages && messages[messages.length - 1];
		listOfConvLastMessage.push({
			roomId: room.id,
			name: room.name ?? '',
			roomType: room.type,
			lastMessageTimestamp: lastMessage ? lastMessage.date : 0,
			members: room.members ?? []
		});
	});
	return orderBy(listOfConvLastMessage, ['lastMessageTimestamp'], ['desc']);
};
