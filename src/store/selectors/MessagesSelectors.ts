/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, forEach, includes, orderBy, size } from 'lodash';

import { FilteredConversation } from '../../chats/components/secondaryBar/SecondaryBarSingleGroupsView';
import {
	AttachmentMessageType,
	ConfigurationMessage,
	Message,
	MessageType,
	TextMessage
} from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMessagesSelector = (store: RootStore, roomId: string): Message[] =>
	store.messages[roomId] ? store.messages[roomId] : [];

export const getTextMessagesSelector = (store: RootStore, roomId: string): TextMessage[] =>
	filter(
		store.messages[roomId],
		(message) => message.type === MessageType.TEXT_MSG
	) as TextMessage[];

export const getReadableMessagesSelector = (
	store: RootStore,
	roomId: string
): (TextMessage | ConfigurationMessage)[] =>
	filter(store.messages[roomId], (message) =>
		includes([MessageType.TEXT_MSG, MessageType.CONFIGURATION_MSG], message.type)
	) as TextMessage[];

export const getLastTextMessageIdSelector = (
	store: RootStore,
	roomId: string
): string | undefined => {
	const textMessages = filter(
		store.messages[roomId],
		(message) => message.type === MessageType.TEXT_MSG
	);
	if (textMessages && textMessages[textMessages.length - 1]) {
		return textMessages[textMessages.length - 1].id;
	}
	return undefined;
};

export const getLastMessageIdSelector = (store: RootStore, roomId: string): string | undefined => {
	if (store.messages[roomId] && store.messages[roomId][store.messages[roomId].length - 1]) {
		return store.messages[roomId][store.messages[roomId].length - 1].id;
	}
	return undefined;
};

export const getMessageSelector = (
	store: RootStore,
	roomId: string,
	messageId: string | undefined
): Message | undefined => find(store.messages[roomId], (message) => message.id === messageId);

export const getRoomIdsOrderedLastMessage = (
	store: RootStore
): { roomId: string; roomType: string; lastMessageTimestamp: number }[] => {
	const listOfConvByLastMessage: {
		roomId: string;
		roomType: string;
		lastMessageTimestamp: number;
	}[] = [];
	// check to remove and tell BE to improve because if a user is removed from a room
	// the messages of this always came back and trigger error
	forEach(store.rooms, (room) => {
		const lastMessage =
			store.messages[room.id] && store.messages[room.id][store.messages[room.id].length - 1];
		listOfConvByLastMessage.push({
			roomId: room.id,
			roomType: room.type,
			lastMessageTimestamp: lastMessage ? lastMessage.date : 0
		});
	});
	return orderBy(listOfConvByLastMessage, ['lastMessageTimestamp'], ['desc']);
};

export const getOneToOneAndGroupsInfoOrderedByLastMessage = (
	store: RootStore
): FilteredConversation[] => {
	const listOfConvByLastMessage: FilteredConversation[] = [];
	// check to remove and tell BE to improve because if a user is removed from a room
	// the messages of this always came back and trigger error
	const filteredRooms = filter(
		store.rooms,
		(room) => room.type === RoomType.GROUP || room.type === RoomType.ONE_TO_ONE
	);
	forEach(filteredRooms, (room) => {
		const lastMessage =
			store.messages[room.id] && store.messages[room.id][store.messages[room.id].length - 1];
		listOfConvByLastMessage.push({
			roomId: room.id,
			name: room.name || '',
			roomType: room.type,
			lastMessageTimestamp: lastMessage ? lastMessage.date : 0,
			members: room.members || []
		});
	});
	return orderBy(listOfConvByLastMessage, ['lastMessageTimestamp'], ['desc']);
};

export const roomIsEmpty = (store: RootStore, roomId: string): boolean =>
	size(store.messages[roomId]) === 0;

export const getMessageAttachment = (
	store: RootStore,
	message: Message | undefined
): AttachmentMessageType | undefined => {
	if (message?.type === MessageType.TEXT_MSG) {
		const textMessage = find(
			store.messages[message.roomId],
			(mex) => mex.id === message.id
		) as TextMessage;
		return textMessage?.attachment;
	}
	return undefined;
};
