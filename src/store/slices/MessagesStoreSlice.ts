/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { concat, find, findIndex, forEach, map, orderBy, sortedUniqBy } from 'lodash';
import { now } from 'moment';

import { calcReads } from '../../network/xmpp/utility/decodeMessage';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	AffiliationMessage,
	DeletedMessage,
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
						id: `dateMessage${now()}`,
						roomId: message.roomId,
						date: now(),
						type: MessageType.DATE_MSG
					});
				}
				// this is a custom message that is shown immediately after a group is created
				if (messagesListLength === 1 && draft.rooms[message.roomId].type === RoomType.GROUP) {
					draft.messages[message.roomId].push({
						id: `dateMessage${message.date}`,
						roomId: message.roomId,
						date: message.date,
						type: MessageType.AFFILIATION_MSG,
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
				forEach(messageArray, (historyMessage: Message, index) => {
					// TODO HANDLE HERE THE EDIT/DELETE MESSAGE REPLACE
					// check if there is a deleted reference in the Temporary-slice and update the message to be displayed as deleted
					if (
						draft.temporaryMessages[roomId] &&
						draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`]
					) {
						const messageDeletion = draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`];
						historyMessage = {
							...messageDeletion,
							date: historyMessage.date
						};
						delete draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`];
					}

					// the first message always needs a date before it
					if (index === 0) {
						historyWithDates.push({
							id: `dateMessage${historyMessage.date}`,
							roomId,
							date: historyMessage.date,
							type: MessageType.DATE_MSG
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
								type: MessageType.DATE_MSG
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
				draft.messages[roomId] = orderBy(draft.messages[roomId], ['date'], ['asc']);
				draft.messages[roomId] = sortedUniqBy(draft.messages[roomId], 'id');

				// the second message has to be a creation one if the conversation is a group one
				if (
					draft.rooms[roomId].type === RoomType.GROUP &&
					messageArray.length < 50 &&
					draft.rooms[roomId].userSettings?.clearedAt === undefined
				) {
					const creationMsg: AffiliationMessage = {
						id: `creationMessage${draft.messages[roomId][0]?.date}`,
						roomId,
						date: draft.messages[roomId][0]?.date,
						type: MessageType.AFFILIATION_MSG,
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
					if (message.type !== MessageType.TEXT_MSG || message.read === MarkerStatus.READ) {
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
					// check if message subject of replay is available in the history and update it if needed
					if (originalMessage) {
						const messageThatIsReplied = find(
							draft.messages[roomId],
							(message) => message.id === repliedMessage.id
						);
						// check if message replied is deleted and update the replay caption
						if (messageThatIsReplied) {
							const repliedMessageIsDeleted: TextMessage | DeletedMessage =
								messageThatIsReplied?.type === MessageType.DELETED_MSG
									? { ...messageThatIsReplied, type: MessageType.DELETED_MSG }
									: repliedMessage;
							if (originalMessage.type === MessageType.TEXT_MSG) {
								originalMessage.repliedMessage = repliedMessageIsDeleted;
							}
							const index = findIndex(draft.messages[roomId], { id: originalMessageId });
							draft.messages[roomId].splice(index, 1, originalMessage);
						} else if (
							draft.temporaryMessages[roomId] &&
							draft.temporaryMessages[roomId][`deleted_${originalMessage.id}`]
						) {
							// check in temporarySlice if the original message needs to be deleted in the messagesSlice
							(originalMessage as TextMessage).repliedMessage =
								draft.temporaryMessages[roomId][`deleted_${originalMessage.id}`];
							const index = findIndex(draft.messages[roomId], { id: originalMessageId });
							draft.messages[roomId].splice(index, 1, originalMessage);
						}
					}
				}
			}),
			false,
			'MESSAGES/SET_REPLIED_MESSAGE'
		);
	},
	setDeletedMessage: (roomId: string, deletedMessage: DeletedMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.messages[roomId]) {
					forEach(draft.messages[roomId], (message, index) => {
						// check for replay messages and update the caption
						if (
							message.type === MessageType.TEXT_MSG &&
							message.repliedMessage &&
							message.repliedMessage.id === deletedMessage.id
						) {
							(draft.messages[roomId][index] as TextMessage).repliedMessage = deletedMessage;
						}
						// replace the original message with the deletion in the history if present
						// otherwise add the deletion to the tempSlice so when the history will be loaded
						// the original message will be deleted
						if (message.id === deletedMessage.id) {
							draft.messages[roomId].splice(index, 1, {
								...deletedMessage,
								date: message.date
							});
						} else {
							draft.addDeletedMessageRef(roomId, deletedMessage);
						}
					});
				}
				return draft;
			}),
			false,
			'MESSAGES/SET_DELETED_MESSAGE'
		);
	}
});
