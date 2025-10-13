/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, find, forEach, includes, last, map, reduce, size } from 'lodash';

import {
	AttachmentMessageType,
	ConfigurationMessage,
	ExtendedMessage,
	FasteningAction,
	Marker,
	Message,
	MessageFastening,
	MessageType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { datesAreFromTheSameDay } from '../../utils/dateUtils';

const FALLBACK_MESSAGE_SELECTOR: Message[] = [];

export const enhanceWithDateMessages = (messages: Message[]): ExtendedMessage[] =>
	messages.reduce<ExtendedMessage[]>((acc, message, index) => {
		const prevDate = messages[index - 1]?.date ?? 0;
		if (!datesAreFromTheSameDay(prevDate, message.date)) {
			acc.push({
				id: `dateMessage-${message.date}`,
				roomId: message.roomId,
				date: message.date,
				type: MessageType.DATE_MSG
			});
		}
		acc.push(message);
		return acc;
	}, []);

export const getMessagesSelector = (store: RootStore, roomId: string): Message[] =>
	store.chatsRegistry[roomId]?.messages
		? store.chatsRegistry[roomId].messages
		: FALLBACK_MESSAGE_SELECTOR;

const readableMessages: (TextMessage | ConfigurationMessage)[] = [];

export const getReadableMessagesSelector = (
	store: RootStore,
	roomId: string
): (TextMessage | ConfigurationMessage)[] => {
	readableMessages.length = 0;
	readableMessages.push(
		...(filter(store.chatsRegistry[roomId]?.messages, (message) =>
			includes([MessageType.TEXT_MSG, MessageType.CONFIGURATION_MSG], message.type)
		) as TextMessage[])
	);
	return readableMessages;
};

export const getLastTextMessageIdSelector = (
	store: RootStore,
	roomId: string
): string | undefined => {
	const textMessages = filter(
		store.chatsRegistry[roomId]?.messages,
		(message) => message.type === MessageType.TEXT_MSG
	);
	if (textMessages && textMessages[textMessages.length - 1]) {
		return textMessages[textMessages.length - 1].id;
	}
	return undefined;
};

export const getLastMessageIdSelector = (store: RootStore, roomId: string): string | undefined => {
	const messages = store.chatsRegistry[roomId]?.messages;
	if (messages?.[messages.length - 1]) {
		return messages[messages.length - 1].id;
	}
	return undefined;
};

export const getMessageSelector = (
	store: RootStore,
	roomId: string,
	messageId: string | undefined
): Message | undefined =>
	find(store.chatsRegistry[roomId]?.messages, (message) => message.id === messageId);

const listOfConvByLastMessage: {
	roomId: string;
	roomType: string;
	lastMessageTimestamp: number;
}[] = [];

export const getRoomIdsWithLastMessage = (
	store: RootStore
): { roomId: string; roomType: string; lastMessageTimestamp: number }[] => {
	listOfConvByLastMessage.length = 0;
	// check to remove and tell BE to improve because if a user is removed from a room
	// the messages of this always came back and trigger error
	forEach(store.rooms, (room) => {
		const messages = store.chatsRegistry[room.id]?.messages;
		const lastMessage = messages?.[messages.length - 1];
		listOfConvByLastMessage.push({
			roomId: room.id,
			roomType: room.type,
			lastMessageTimestamp: lastMessage ? lastMessage.date : 0
		});
	});
	return listOfConvByLastMessage;
};

export const roomIsEmpty = (store: RootStore, roomId: string): boolean =>
	size(store.chatsRegistry[roomId]?.messages) === 0;

export const getMessageAttachment = (
	store: RootStore,
	message: Message | undefined
): AttachmentMessageType | undefined => {
	if (message?.type === MessageType.TEXT_MSG) {
		const textMessage = find(
			store.chatsRegistry[message.roomId]?.messages,
			(mex) => mex.id === message.id
		) as TextMessage;
		return textMessage?.attachment;
	}
	return undefined;
};

export const getEditAndDeleteFasteningSelector = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): MessageFastening | undefined => {
	if (state.chatsRegistry[roomId]?.fastenings?.[stanzaId]) {
		const editAndDeleteFastenings = state.chatsRegistry[roomId]?.fastenings?.[stanzaId].filter(
			(fastening) =>
				fastening.action === FasteningAction.EDIT || fastening.action === FasteningAction.DELETE
		);
		return last(editAndDeleteFastenings);
	}
	return undefined;
};

export const getMyLastReaction = (
	state: RootStore,
	roomId: string,
	stanzaId: string
): string | undefined => {
	const fastenings = state.chatsRegistry[roomId]?.fastenings?.[stanzaId];
	if (fastenings) {
		const myReactions = filter(
			fastenings,
			(fastening) =>
				fastening.action === FasteningAction.REACTION && fastening.from === state.session?.id
		);
		return last(myReactions)?.value;
	}
	return undefined;
};

export const getMyLastMarkerOfRoom = (store: RootStore, roomId: string): Marker | null => {
	if (store.session.id && store.chatsRegistry[roomId]?.markers[store.session.id]) {
		return store.chatsRegistry[roomId]?.markers[store.session.id];
	}
	return null;
};

export const getRoomHasMarkers = (store: RootStore, roomId: string): boolean =>
	!!store.chatsRegistry[roomId]?.markers;

export const getMarkers = (store: RootStore, roomId: string): { [userId: string]: Marker } =>
	store.chatsRegistry[roomId]?.markers;

export const getTotalUnreadCountSelector = (store: RootStore): number => {
	const sum = (amount: number, n: number): number => amount + n;
	return reduce(
		map(store.chatsRegistry, ({ unread }, key) => {
			const room = store.rooms[key];
			if (!!room && !room.userSettings?.muted && room.type !== 'temporary') {
				return unread;
			}
			return 0;
		}),
		sum,
		0
	);
};

export const getRoomUnreadSelector = (store: RootStore, roomId: string): number =>
	store.chatsRegistry[roomId]?.unread || 0;
