/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import {
	concat,
	find,
	findIndex,
	first,
	forEach,
	last,
	map,
	orderBy,
	remove,
	size,
	uniqBy
} from 'lodash';
import { StateCreator } from 'zustand';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { UsersApi } from '../../network';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	ConfigurationMessage,
	Message,
	MessageList,
	MessageType,
	OperationType,
	PlaceholderFields,
	TextMessage
} from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { MessagesStoreSlice, RootStore } from '../../types/store/StoreTypes';
import { UsersMap } from '../../types/store/UserTypes';
import { calcReads } from '../../utils/calcReads';
import { datesAreFromTheSameDay, isBefore, isStrictlyBefore } from '../../utils/dateUtils';

// Retrieve user information about userId in the various type of message (only if it is unknown)
const retrieveMessageUserInfo = (message: Message, users: UsersMap): void => {
	if (message.type === MessageType.TEXT_MSG) {
		if (!users[message.from]) UsersApi.getDebouncedUser(message.from);
		if (message.forwarded && !users[message.forwarded.from])
			UsersApi.getDebouncedUser(message.forwarded.from);
	} else if (message.type === MessageType.CONFIGURATION_MSG) {
		if (!users[message.from]) UsersApi.getDebouncedUser(message.from);
		if (
			(message.operation === OperationType.MEMBER_ADDED ||
				message.operation === OperationType.MEMBER_REMOVED) &&
			!users[message.value]
		) {
			UsersApi.getDebouncedUser(message.value);
		}
	}
};

export const useMessagesStoreSlice: StateCreator<MessagesStoreSlice> = (
	set: (...any: any) => void
) => ({
	messages: {},
	newMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				// Initialize messages list if it does not exist
				if (!draft.messages[message.roomId]) draft.messages[message.roomId] = [];

				// Add date message if the new message has a different date than the previous one
				const lastMessageDate = last(draft.messages[message.roomId])?.date || 0;
				if (!datesAreFromTheSameDay(lastMessageDate, message.date)) {
					draft.messages[message.roomId].push({
						id: `dateMessage${message.date - 2}`,
						roomId: message.roomId,
						date: message.date - 2,
						type: MessageType.DATE_MSG
					});
				}

				// Add message to the end of list or replace a placeholder message
				const placeholderMessageIndex = findIndex(draft.messages[message.roomId], {
					id: message.id
				});
				if (placeholderMessageIndex !== -1) {
					const newMessage = {
						...draft.messages[message.roomId][placeholderMessageIndex],
						...message
					};
					draft.messages[message.roomId].splice(placeholderMessageIndex, 1, newMessage);
				} else {
					draft.messages[message.roomId].push(message);
				}

				// Retrieve user information
				retrieveMessageUserInfo(message, draft.users);
			}),
			false,
			'MESSAGES/NEW_MESSAGE'
		);
	},
	newInboxMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				// Initialize messages list if it does not exist
				if (!draft.messages[message.roomId]) draft.messages[message.roomId] = [];

				// Avoid adding the same message if a history request had already added the same message
				const alreadyExists = find(draft.messages[message.roomId], { id: message.id });
				if (!alreadyExists) {
					// Avoid setting a last message dated before clearAt
					const roomHistoryIsBeenCleared = draft.rooms[message.roomId]?.userSettings?.clearedAt;
					if (!roomHistoryIsBeenCleared || isBefore(roomHistoryIsBeenCleared, message.date)) {
						// Add always a date message before the inbox message
						draft.messages[message.roomId].push({
							id: `dateMessage${message.date - 2}`,
							roomId: message.roomId,
							date: message.date - 2,
							type: MessageType.DATE_MSG
						});
						draft.messages[message.roomId].push(message);
					}

					// Retrieve user information
					retrieveMessageUserInfo(message, draft.users);
				}
			}),
			false,
			'MESSAGES/NEW_INBOX_MESSAGE'
		);
	},
	updateHistory: (roomId: string, messageArray: Message[]): void => {
		set(
			produce((draft: RootStore) => {
				// Initialize messages list if it does not exist
				if (!draft.messages[roomId]) draft.messages[roomId] = [];

				// Be sure that array with the new history messages will be processed in the correct date order
				const orderedMessageArray = orderBy(messageArray, ['date'], ['asc']);

				const historyWithDates: MessageList = [];
				forEach(orderedMessageArray, (historyMessage: Message, index) => {
					// Process only new messages (i.e. messages dated before the last message of the current history)
					if (
						!draft.messages[roomId][0] ||
						isStrictlyBefore(historyMessage.date, draft.messages[roomId][0].date)
					) {
						// Add date message if the new message has a different date than the previous one
						const prevMessageDate = orderedMessageArray[index - 1]?.date || 0;
						if (!datesAreFromTheSameDay(prevMessageDate, historyMessage.date)) {
							historyWithDates.push({
								id: `dateMessage${historyMessage.date - 2}`,
								roomId,
								date: historyMessage.date - 2,
								type: MessageType.DATE_MSG
							});
						}
						historyWithDates.push(historyMessage);

						// Retrieve user information
						retrieveMessageUserInfo(historyMessage, draft.users);
					}
				});

				if (size(historyWithDates) > 0) {
					// Remove old first date message if the last message of the new history has the same date
					const oldFirstMessage = draft.messages[roomId][0];
					const lastRequestedMessageDate = last(historyWithDates)?.date || 0;
					if (
						oldFirstMessage?.type === MessageType.DATE_MSG &&
						datesAreFromTheSameDay(oldFirstMessage.date, lastRequestedMessageDate)
					) {
						remove(draft.messages[roomId], (message) => message.id === oldFirstMessage.id);
					}

					draft.messages[roomId] = concat(historyWithDates, draft.messages[roomId]);

					// We must check for duplicates because inbox message has
					// a different date than the same message in history.
					draft.messages[roomId] = uniqBy(draft.messages[roomId], 'id');
				}
			}),
			false,
			'MESSAGES/UPDATE_HISTORY'
		);
	},
	addCreateRoomMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const firstMessageDate = first(draft.messages[roomId])?.date;
				const creationMessage = find(
					draft.messages[roomId],
					(message) =>
						message.type === MessageType.CONFIGURATION_MSG &&
						message.operation === OperationType.ROOM_CREATION
				);
				const historyIsBeenCleared = !!draft.rooms[roomId].userSettings?.clearedAt;
				// Add creation message only if the room is a non-empty group without the history cleared
				if (
					draft.rooms[roomId].type === RoomType.GROUP &&
					firstMessageDate &&
					!creationMessage &&
					!historyIsBeenCleared
				) {
					const creationMsg: ConfigurationMessage = {
						id: `creationMessage${firstMessageDate + 1}`,
						roomId,
						date: firstMessageDate + 1,
						type: MessageType.CONFIGURATION_MSG,
						operation: OperationType.ROOM_CREATION,
						value: '',
						from: '',
						read: MarkerStatus.READ
					};
					draft.messages[roomId].splice(1, 0, creationMsg);
				}
			}),
			false,
			'MESSAGES/CREATE_ROOM_MESSAGE'
		);
	},
	updateUnreadMessages: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.messages[roomId]) draft.messages[roomId] = [];

				draft.messages[roomId] = map(draft.messages[roomId], (message: Message) => {
					// Updating text and configuration messages which are not read yet
					const readable =
						message.type === MessageType.TEXT_MSG || message.type === MessageType.CONFIGURATION_MSG;

					if (
						readable &&
						(message.read === MarkerStatus.UNREAD || message.read === MarkerStatus.READ_BY_SOMEONE)
					) {
						message.read = calcReads(message.date, roomId);
					}

					return message;
				});
			}),
			false,
			'MESSAGES/UPDATE_UNREAD_MESSAGES'
		);
	},
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string, // id of message which contains the replyMessage and replyTo fields
		messageSubjectOfReply: TextMessage // message not in history which will be placed as replyMessage if not edited/deleted
	): void => {
		set(
			produce((draft: RootStore) => {
				// Message to add the replyMessage prop
				const messageWithAResponse = find(
					draft.messages[roomId],
					(message) => message.id === replyMessageId
				) as TextMessage;
				if (messageWithAResponse) {
					messageWithAResponse.repliedMessage = messageSubjectOfReply;
				}

				retrieveMessageUserInfo(messageSubjectOfReply, draft.users);
			}),
			false,
			'MESSAGES/SET_REPLIED_MESSAGE'
		);
	},
	setPlaceholderMessage: ({
		roomId,
		id,
		text,
		replyTo,
		attachment,
		forwarded
	}: PlaceholderFields): void => {
		set(
			produce((draft: RootStore) => {
				const placeholderMessage: TextMessage = {
					id,
					stanzaId: `placeholder_${id}`,
					roomId,
					date: Date.now(),
					type: MessageType.TEXT_MSG,
					from: draft.session.id!,
					text,
					read: MarkerStatus.PENDING,
					replyTo,
					attachment,
					forwarded
				};

				// Initialize messages list if it does not exist
				if (!draft.messages[roomId]) draft.messages[roomId] = [];

				// Add date message if the new message has a different date than the previous one
				const lastMessageDate = last(draft.messages[roomId])?.date || 0;
				if (!datesAreFromTheSameDay(lastMessageDate, placeholderMessage.date)) {
					draft.messages[roomId].push({
						id: `dateMessage${placeholderMessage.date - 2}`,
						roomId,
						date: placeholderMessage.date - 2,
						type: MessageType.DATE_MSG
					});
				}

				// Request message subject of reply
				const messageSubjectOfReplyId = placeholderMessage.replyTo;
				if (messageSubjectOfReplyId) {
					const messageSubjectOfReply = find(
						draft.messages[roomId],
						(message) =>
							message.type === MessageType.TEXT_MSG && message.stanzaId === messageSubjectOfReplyId
					) as TextMessage;
					if (messageSubjectOfReply) {
						placeholderMessage.repliedMessage = messageSubjectOfReply;
					}
				}

				// Add message to the end of list or replace a placeholder message
				draft.messages[roomId].push(placeholderMessage);

				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: placeholderMessage });
			}),
			false,
			'MESSAGES/SET_PLACEHOLDER_MESSAGE'
		);
	},
	removePlaceholderMessage: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				remove(draft.messages[roomId], (message) => message.id === messageId);
				if (
					draft.messages[roomId][draft.messages[roomId].length - 1].type === MessageType.DATE_MSG
				) {
					draft.messages[roomId].pop();
				}
			}),
			false,
			'MESSAGES/REMOVE_PLACEHOLDER_MESSAGE'
		);
	}
});
