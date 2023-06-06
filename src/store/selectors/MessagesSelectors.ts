/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, find, forEach, orderBy, size } from 'lodash';

import { Message, MessageType, TextMessage } from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMessagesSelector = (state: RootStore, roomId: string): Message[] =>
	state.messages[roomId] ? state.messages[roomId] : [];

export const getTextMessagesSelector = (state: RootStore, roomId: string): TextMessage[] =>
	filter(
		state.messages[roomId],
		(message) => message.type === MessageType.TEXT_MSG
	) as TextMessage[];

export const getLastMessageIdSelector = (state: RootStore, roomId: string): string | undefined => {
	if (state.messages[roomId] && state.messages[roomId][state.messages[roomId].length - 1]) {
		return state.messages[roomId][state.messages[roomId].length - 1].id;
	}
	return undefined;
};

export const getMessageSelector = (
	state: RootStore,
	roomId: string,
	messageId: string | undefined
): Message | undefined => find(state.messages[roomId], (message) => message.id === messageId);

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

export const roomIsEmpty = (state: RootStore, roomId: string): boolean =>
	size(state.messages[roomId]) === 0;
