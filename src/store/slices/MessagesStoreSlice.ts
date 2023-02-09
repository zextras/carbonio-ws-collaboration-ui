/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { concat, find, findIndex, map, orderBy, sortedUniqBy } from 'lodash';
import { now } from 'moment';

import { calcReads } from '../../network/xmpp/utility/decodeMessage';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	AffiliationMessage,
	Message,
	MessageList,
	TextMessage
} from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { MessagesStoreSlice, RootStore } from '../../types/store/StoreTypes';
import { isBefore, datesAreFromTheSameDay } from '../../utils/dateUtil';

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
						id: `dateMessage${now()}`,
						roomId: message.roomId,
						date: now(),
						type: 'date'
					});
				}
				// this is a custom message that is shown immediately after a group is created
				if (messagesListLength === 1 && draft.rooms[message.roomId].type === RoomType.GROUP) {
					draft.messages[message.roomId].push({
						id: `dateMessage${message.date}`,
						roomId: message.roomId,
						date: message.date,
						type: 'affiliation',
						as: 'creation',
						userId: ''
					});
				}
				draft.messages[message.roomId].push(message);
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
				map(messageArray, (historyMessage: Message, index) => {
					// the first message always needs a date before it
					if (index === 0) {
						historyWithDates.push({
							id: `dateMessage${historyMessage.date}`,
							roomId,
							date: historyMessage.date,
							type: 'date'
						});
						historyWithDates.push(historyMessage);
					} else {
						const prevMessage = messageArray[index - 1];
						// if the actual message and the previous one has not the same date, it puts a date message before the actual one
						if (datesAreFromTheSameDay(prevMessage?.date, historyMessage?.date)) {
							historyWithDates.push({
								id: `dateMessage${historyMessage.date}`,
								roomId,
								date: historyMessage.date,
								type: 'date'
							});
							historyWithDates.push(historyMessage);
							// the actual message and the previous one shares the same date
						} else {
							historyWithDates.push(historyMessage);
						}
					}
				});

				// the historyWithDates array will be concat to the list already present (draft.messages[roomId])
				// we have to be sure that there's no date duplicates along the list
				// this checks if the last historyWithDates element and the firs one in draft.messages[roomId] shares the same date
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
				draft.messages[roomId] = orderBy(draft.messages[roomId], ['date'], ['asc']);
				draft.messages[roomId] = sortedUniqBy(draft.messages[roomId], 'id');

				// the second message has to be a creation one if the conversation is a group one
				if (draft.rooms[roomId].type === RoomType.GROUP) {
					const creationMsg: AffiliationMessage = {
						id: `creationMessage${draft.messages[roomId][0]?.date}`,
						roomId,
						date: draft.messages[roomId][0]?.date,
						type: 'affiliation',
						as: 'creation',
						userId: ''
					};
					draft.messages[roomId].splice(1, 0, creationMsg);
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
					// todo handle attachment message type
					if (message.type !== 'text' || message.read === MarkerStatus.READ) {
						return message;
					}
					// eslint-disable-next-line no-param-reassign
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
		originalMessageId: string,
		repliedMessage: TextMessage
	): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.messages[roomId]) {
					const originalMessage = find(
						draft.messages[roomId],
						(message) => message.id === originalMessageId
					);
					if (originalMessage) {
						(originalMessage as TextMessage).repliedMessage = repliedMessage;
						const index = findIndex(draft.messages[roomId], { id: originalMessageId });
						draft.messages[roomId].splice(index, 1, originalMessage);
					}
				}
			}),
			false,
			'MESSAGES/SET_REPLIED_MESSAGE'
		);
	}
});
