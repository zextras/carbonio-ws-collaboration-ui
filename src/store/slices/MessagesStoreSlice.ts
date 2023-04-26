/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { concat, find, forEach, map, orderBy, sortedUniqBy } from 'lodash';

import { UsersApi } from '../../network';
import { calcReads } from '../../network/xmpp/utility/decodeXMPPMessageStanza';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	AffiliationMessage,
	Message,
	MessageList,
	MessageType,
	TextMessage
} from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { MessagesStoreSlice, RootStore } from '../../types/store/StoreTypes';
import { datesAreFromTheSameDay, isBefore } from '../../utils/dateUtil';

export const useMessagesStoreSlice = (set: (...any: any) => void): MessagesStoreSlice => ({
	messages: {},
	newMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.messages[message.roomId]) draft.messages[message.roomId] = [];
				// if the message has a different date than the previous one it will add the date
				const messagesListLength = draft.messages[message.roomId].length;
				if (
					datesAreFromTheSameDay(
						draft.messages[message.roomId][messagesListLength - 1]?.date,
						message?.date
					)
				) {
					draft.messages[message.roomId].push({
						id: `dateMessage${message.date - 2}`,
						roomId: message.roomId,
						date: message.date - 2,
						type: MessageType.DATE_MSG
					});
				}
				// this is a custom message that is shown immediately after a group is created
				if (messagesListLength === 1 && draft.rooms[message.roomId].type === RoomType.GROUP) {
					draft.messages[message.roomId].push({
						id: `dateMessage${message.date - 1}`,
						roomId: message.roomId,
						date: message.date - 1,
						type: MessageType.AFFILIATION_MSG,
						as: 'creation',
						userId: ''
					});
				}
				draft.messages[message.roomId].push(message);

				// Retrieve sender information if it is unknown
				if (message.type === MessageType.TEXT_MSG) {
					if (!draft.users[message.from]) {
						UsersApi.getDebouncedUser(message.from);
					}
					if (message.forwarded && !draft.users[message.forwarded.from]) {
						UsersApi.getDebouncedUser(message.forwarded.from);
					}
				}
			}),
			false,
			'MESSAGES/NEW_MESSAGE'
		);
	},
	newInboxMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.messages[message.roomId]) draft.messages[message.roomId] = [];

				// Avoid setting a last message dated before clearAt
				if (
					!draft.rooms[message.roomId]?.userSettings?.clearedAt ||
					isBefore(draft.rooms[message.roomId].userSettings!.clearedAt!, message.date)
				) {
					draft.messages[message.roomId].push(message);
				}

				// Retrieve sender information if it is unknown
				if (message.type === MessageType.TEXT_MSG) {
					if (!draft.users[message.from]) {
						UsersApi.getDebouncedUser(message.from);
					}
					if (message.forwarded && !draft.users[message.forwarded.from]) {
						UsersApi.getDebouncedUser(message.forwarded.from);
					}
				}
			}),
			false,
			'MESSAGES/NEW_INBOX_MESSAGE'
		);
	},
	updateHistory: (roomId: string, messageArray: Message[]): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.messages[roomId]) draft.messages[roomId] = [];
				// this checks if the last element present inside the history has not the same date of the first element of the requested history
				const historyWithDates: MessageList = [];
				forEach(messageArray, (historyMessage: Message, index) => {
					// the first message always needs a date before it
					if (index === 0) {
						historyWithDates.push({
							id: `dateMessage${historyMessage.date - 2}`,
							roomId,
							date: historyMessage.date - 2,
							type: MessageType.DATE_MSG
						});
						historyWithDates.push(historyMessage);
					} else {
						const prevMessage = messageArray[index - 1];
						// if the actual message and the previous one has not the same date, it puts a date message before the actual one
						if (datesAreFromTheSameDay(prevMessage?.date, historyMessage?.date)) {
							historyWithDates.push({
								id: `dateMessage${historyMessage.date - 2}`,
								roomId,
								date: historyMessage.date - 2,
								type: MessageType.DATE_MSG
							});
							historyWithDates.push(historyMessage);
							// the actual message and the previous one shares the same date
						} else {
							historyWithDates.push(historyMessage);
						}
					}

					// Retrieve sender information if it is unknown
					if (historyMessage.type === MessageType.TEXT_MSG) {
						if (!draft.users[historyMessage.from]) {
							UsersApi.getDebouncedUser(historyMessage.from);
						}
						if (historyMessage.forwarded && !draft.users[historyMessage.forwarded.from]) {
							UsersApi.getDebouncedUser(historyMessage.forwarded.from);
						}
					}
				});

				// the historyWithDates array will be concat to the list already present (draft.messages[roomId])
				// we have to be sure that there's no date duplicates along the list
				// this checks if the last historyWithDates element and the first one in draft.messages[roomId] shares the same date
				// if so it shift the first element already present, that will be always a date message thanks to the previous map
				if (
					draft.messages[roomId] &&
					!datesAreFromTheSameDay(
						historyWithDates[historyWithDates.length - 1].date,
						draft.messages[roomId][0]?.date
					)
				) {
					draft.messages[roomId].shift();
				}

				draft.messages[roomId] = concat(historyWithDates, draft.messages[roomId]);
				// message list has to be ordered by date
				draft.messages[roomId] = orderBy(draft.messages[roomId], ['date'], ['asc']);
				// the second message has to be a creation one if the conversation is a group one and the history has never been cleared

				if (
					draft.activeConversations[roomId] &&
					draft.activeConversations[roomId].isHistoryFullyLoaded &&
					draft.rooms[roomId].type === RoomType.GROUP &&
					draft.rooms[roomId].userSettings?.clearedAt === undefined
				) {
					const creationMsg: AffiliationMessage = {
						id: `creationMessage${draft.messages[roomId][0].date + 1}`,
						roomId,
						date: draft.messages[roomId][0].date + 1,
						type: MessageType.AFFILIATION_MSG,
						as: 'creation',
						userId: ''
					};
					draft.messages[roomId].splice(1, 0, creationMsg);
				}
				// message list can't have duplicates, so it's sorted by id
				draft.messages[roomId] = sortedUniqBy(draft.messages[roomId], 'id');

				// checks if creation message is duplicated and removes it
				if (draft.messages[roomId][0].id === draft.messages[roomId][2].id) {
					draft.messages[roomId].splice(0, 2);
				}
			}),
			false,
			'MESSAGES/UPDATE_HISTORY'
		);
	},
	updateUnreadMessages: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.messages[roomId]) draft.messages[roomId] = [];
				draft.messages[roomId] = map(draft.messages[roomId], (message: Message) => {
					if (message.type !== MessageType.TEXT_MSG || message.read === MarkerStatus.READ) {
						return message;
					}
					message.read = calcReads(message.date, roomId);
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
				);
				if (messageWithAResponse && messageWithAResponse.type === MessageType.TEXT_MSG) {
					const referenceMessageOnHistory = find(
						draft.messages[roomId],
						(message) => message.id === messageSubjectOfReply.id
					);
					// Check if message reference is already loaded on local history.
					// TODO fix better this check
					if (referenceMessageOnHistory) {
						messageWithAResponse.repliedMessage = referenceMessageOnHistory as TextMessage;
					} else {
						messageWithAResponse.repliedMessage = messageSubjectOfReply;
					}
				}
			}),
			false,
			'MESSAGES/SET_REPLIED_MESSAGE'
		);
	}
});
