/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { concat, find, findIndex, forEach, map, orderBy, sortedUniqBy } from 'lodash';

import { calcReads } from '../../network/xmpp/utility/decodeMessage';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	DeletedMessage,
	EditedMessage,
	Message,
	MessageList,
	MessageType,
	TextMessage
} from '../../types/store/MessageTypes';
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
						id: `dateMessage${message.date}`,
						roomId: message.roomId,
						date: message.date,
						type: MessageType.DATE_MSG
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
					// check if a message in temporaryMessages has both edit and delete reference and inca se remove both and set as delete
					if (
						draft.temporaryMessages[roomId] &&
						draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`] &&
						draft.temporaryMessages[roomId][`edited_${historyMessage.id}`]
					) {
						const messageDeletion = draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`];
						historyMessage = {
							...messageDeletion,
							date: historyMessage.date
						};
						delete draft.temporaryMessages[roomId][`deleted_${historyMessage.id}`];
						delete draft.temporaryMessages[roomId][`edited_${historyMessage.id}`];
					}
					// check if there is a deleted reference in temporaryMessages and update the message to be displayed as deleted
					else if (
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
					// check if there is an edited reference in temporaryMessages and update the message to be displayed as edited
					else if (
						draft.temporaryMessages[roomId] &&
						draft.temporaryMessages[roomId][`edited_${historyMessage.id}`]
					) {
						const messageEdited = draft.temporaryMessages[roomId][`edited_${historyMessage.id}`];
						historyMessage = {
							...messageEdited,
							date: historyMessage.date
						};
						delete draft.temporaryMessages[roomId][`edited_${historyMessage.id}`];
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
		replayMessageId: string, // id of message which contains the replayMessage and replayTo fields
		repliedMessage: TextMessage | EditedMessage // message not in history which will be placed as replayMessage if not edited/deleted
	): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.messages[roomId]) {
					// retrieve the replayMessage from messagesList
					const replayMessage = find(
						draft.messages[roomId],
						(message) => message.id === replayMessageId
					);
					// return a message that if it was edited or deleted is still present
					// and return it as not edited or deleted, so we need to check if in the history we have this message and if it's edited/delete use them as
					// reference for the replay view
					if (replayMessage) {
						const repliedMessageInHistory = find(
							draft.messages[roomId],
							(message) => message.id === repliedMessage.id
						);
						// check if message subject of replay is available in the history and
						// if is deleted or edited and update the replay caption
						if (repliedMessageInHistory) {
							let messageToPlaceAsReplayedMessage: TextMessage | EditedMessage | DeletedMessage =
								repliedMessage;
							if (repliedMessageInHistory.type === MessageType.DELETED_MSG) {
								messageToPlaceAsReplayedMessage = {
									...repliedMessageInHistory,
									type: MessageType.DELETED_MSG
								};
							} else if (repliedMessageInHistory.type === MessageType.EDITED_MSG) {
								messageToPlaceAsReplayedMessage = repliedMessageInHistory;
							}
							if (
								replayMessage.type === MessageType.TEXT_MSG ||
								replayMessage.type === MessageType.EDITED_MSG
							) {
								replayMessage.repliedMessage = messageToPlaceAsReplayedMessage;
							}
							const index = findIndex(draft.messages[roomId], { id: replayMessageId });
							draft.messages[roomId].splice(index, 1, replayMessage);
						}
						// replied message is not in the history because 50+ message behind so
						// update the replay view with the info in the temporaryMessages
						else if (
							draft.temporaryMessages[roomId] &&
							draft.temporaryMessages[roomId][`deleted_${repliedMessage.id}`]
						) {
							(replayMessage as TextMessage).repliedMessage =
								draft.temporaryMessages[roomId][`deleted_${repliedMessage.id}`];
							const index = findIndex(draft.messages[roomId], { id: replayMessageId });
							draft.messages[roomId].splice(index, 1, replayMessage);
						} else if (
							draft.temporaryMessages[roomId] &&
							draft.temporaryMessages[roomId][`edited_${repliedMessage.id}`]
						) {
							(replayMessage as TextMessage).repliedMessage =
								draft.temporaryMessages[roomId][`edited_${repliedMessage.id}`];
							const index = findIndex(draft.messages[roomId], { id: replayMessageId });
							draft.messages[roomId].splice(index, 1, replayMessage);
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
							(message.type === MessageType.TEXT_MSG || message.type === MessageType.EDITED_MSG) &&
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
						} else if (
							!draft.temporaryMessages[deletedMessage.roomId] ||
							!draft.temporaryMessages[deletedMessage.roomId][`deleted_${deletedMessage.id}`]
						) {
							draft.addDeletedMessageRef(roomId, deletedMessage);
						}
					});
				}
			}),
			false,
			'MESSAGES/SET_DELETED_MESSAGE'
		);
	},
	setEditedMessage: (roomId: string, editedMessage: EditedMessage): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.messages[roomId]) {
					forEach(draft.messages[roomId], (message, index) => {
						// check for replay messages and update the caption
						if (
							message.type === MessageType.TEXT_MSG &&
							message.repliedMessage &&
							message.repliedMessage.id === editedMessage.id
						) {
							(draft.messages[roomId][index] as TextMessage).repliedMessage = editedMessage;
						}
						// replace the original message with the correction in the history if present
						// otherwise add the correction to the tempSlice so when the history will be loaded
						// the original message will be edited
						if (
							(message.type === MessageType.TEXT_MSG || message.type === MessageType.EDITED_MSG) &&
							message.id === editedMessage.id
						) {
							if (message.replyTo) {
								draft.messages[roomId].splice(index, 1, {
									...editedMessage,
									date: message.date,
									replyTo: message.replyTo,
									repliedMessage: message.repliedMessage
								});
							} else {
								draft.messages[roomId].splice(index, 1, {
									...editedMessage,
									date: message.date
								});
							}
						} else if (
							!draft.temporaryMessages[editedMessage.roomId] ||
							!draft.temporaryMessages[editedMessage.roomId][`edited_${editedMessage.id}`]
						) {
							draft.addEditedMessageRef(roomId, editedMessage);
						}
					});
				}
			}),
			false,
			'MESSAGES/SET_EDITED_MESSAGE'
		);
	}
});
