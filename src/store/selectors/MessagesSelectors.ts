/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, forEach, orderBy, size } from 'lodash';

import { Message, TextMessage } from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMessagesSelector = (state: RootStore, roomId: string): Message[] =>
	state.messages[roomId] ? state.messages[roomId] : [];

export const getLastMessageSelector = (state: RootStore, roomId: string): Message | null =>
	state.messages[roomId] ? state.messages[roomId][state.messages[roomId].length - 1] : null;

export const getMessageSelector = (
	state: RootStore,
	roomId: string,
	messageId: string | undefined
): Message | undefined => find(state.messages[roomId], (message) => message.id === messageId);

export const getTextMessageSelector = (
	state: RootStore,
	roomId: string,
	messageId: string | undefined
): TextMessage | undefined =>
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	find(state.messages[roomId], (message) => message.type === 'text' && message.id === messageId);

export const getFistMessageOfHistory = (state: RootStore, roomId: string): Message =>
	state.messages[roomId] && state.messages[roomId][0];

export const getSingleMessageSelector = (
	state: RootStore,
	roomId: string,
	messageId: string
): Message | undefined => find(state.messages[roomId], (msg) => msg.id === messageId);

export const getRoomIdsOrderedLastMessage = (
	store: RootStore
): { roomId: string; lastMessageTimestamp: number }[] => {
	const listOfConvByLastMessage: { roomId: string; lastMessageTimestamp: number }[] = [];
	// check to remove and tell BE to improve because if a user is removed from a room
	// the messages of this always came back and trigger error
	forEach(store.rooms, (room) => {
		const lastMessage =
			store.messages[room.id] && store.messages[room.id][store.messages[room.id].length - 1];
		listOfConvByLastMessage.push({
			roomId: room.id,
			lastMessageTimestamp: lastMessage ? lastMessage.date : 0
		});
	});
	return orderBy(listOfConvByLastMessage, ['lastMessageTimestamp'], ['desc']);
};

export const roomIsEmpty = (state: RootStore, roomId: string): boolean =>
	size(state.messages[roomId]) === 0;
