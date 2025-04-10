/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import {
	concat,
	filter,
	find,
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
import { isMyId } from '../../network/websocket/eventHandlersUtilities';
import {
	ChatsRegistryStoreSlice,
	ConfigurationMessage,
	Marker,
	MarkerStatus,
	Message,
	MessageFastening,
	MessageType,
	OperationType,
	PlaceholderFields,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { calcReads } from '../../utils/calcReads';
import { datesAreFromTheSameDay, isBefore, isStrictlyBefore } from '../../utils/dateUtils';

const initRoomChatsRegistry = (store: RootStore, roomId: string): void => {
	if (!store.chatsRegistry[roomId]) {
		store.chatsRegistry[roomId] = {
			messages: [],
			fastenings: {},
			markers: {},
			unread: 0
		};
	}
};

const addDateMessage = (messages: Message[], messageDate: number, roomId: string): void => {
	const lastDate = last(messages)?.date ?? 0;
	if (!datesAreFromTheSameDay(lastDate, messageDate)) {
		messages.push({
			id: `dateMessage${messageDate - 2}`,
			roomId,
			date: messageDate - 2,
			type: MessageType.DATE_MSG
		});
	}
};

export const useChatsRegistryStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ChatsRegistryStoreSlice
> = (set) => ({
	chatsRegistry: {},
	newMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, message.roomId);

				const messages = draft.chatsRegistry[message.roomId]?.messages;
				const existing = find(messages, { id: message.id });
				// Replace message if it already exists (placeholder message)
				if (existing) {
					Object.assign(existing, message);
				} else {
					addDateMessage(messages, message.date, message.roomId);
					messages.push(message);
				}
			}),
			false,
			'CHAT/NEW_MESSAGE'
		);
	},
	newInboxMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, message.roomId);

				const messages = draft.chatsRegistry[message.roomId]?.messages;
				const alreadyExists = find(messages, { id: message.id });
				const clearedAt = draft.rooms[message.roomId]?.userSettings?.clearedAt;
				// Add message only if it doesn't already exist and the history is not cleared
				if (!alreadyExists && (!clearedAt || isBefore(clearedAt, message.date))) {
					addDateMessage(messages, message.date, message.roomId);
					messages.push(message);
				}
			}),
			false,
			'CHAT/NEW_INBOX_MESSAGE'
		);
	},
	updateHistory: (roomId: string, messageArray: Message[]): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);

				// Be sure that array with the new history messages will be processed in the correct date order
				const orderedMessageArray = orderBy(messageArray, ['date'], ['asc']);

				const historyWithDates: Message[] = [];
				forEach(orderedMessageArray, (historyMessage: Message, index) => {
					// Process only new messages (i.e. messages dated before the last message of the current history)
					if (
						!draft.chatsRegistry[roomId].messages[0] ||
						isStrictlyBefore(historyMessage.date, draft.chatsRegistry[roomId].messages[0].date)
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
					}
				});

				if (size(historyWithDates) > 0) {
					// Remove old first date message if the last message of the new history has the same date
					const oldFirstMessage = draft.chatsRegistry[roomId].messages[0];
					const lastRequestedMessageDate = last(historyWithDates)?.date ?? 0;
					if (
						oldFirstMessage?.type === MessageType.DATE_MSG &&
						datesAreFromTheSameDay(oldFirstMessage.date, lastRequestedMessageDate)
					) {
						remove(
							draft.chatsRegistry[roomId].messages,
							(message) => message.id === oldFirstMessage.id
						);
					}

					draft.chatsRegistry[roomId].messages = concat(
						historyWithDates,
						draft.chatsRegistry[roomId].messages
					);

					// We must check for duplicates because inbox message has
					// a different date than the same message in history.
					draft.chatsRegistry[roomId].messages = uniqBy(draft.chatsRegistry[roomId].messages, 'id');
				}
			}),
			false,
			'MESSAGES/UPDATE_HISTORY'
		);
	},
	addCreateRoomMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const firstMessageDate = first(draft.chatsRegistry[roomId].messages)?.date;
				const creationMessage = find(
					draft.chatsRegistry[roomId].messages,
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
					draft.chatsRegistry[roomId].messages.splice(1, 0, creationMsg);
				}
			}),
			false,
			'MESSAGES/CREATE_ROOM_MESSAGE'
		);
	},
	updateUnreadMessages: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);

				draft.chatsRegistry[roomId].messages = map(
					draft.chatsRegistry[roomId].messages,
					(message: Message) => {
						// Updating text and configuration messages which are not read yet
						const readable =
							message.type === MessageType.TEXT_MSG ||
							message.type === MessageType.CONFIGURATION_MSG;

						if (
							readable &&
							(message.read === MarkerStatus.UNREAD ||
								message.read === MarkerStatus.READ_BY_SOMEONE)
						) {
							message.read = calcReads(message.date, roomId);
						}

						return message;
					}
				);
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
					draft.chatsRegistry[roomId].messages,
					(message) => message.id === replyMessageId
				) as TextMessage;
				if (messageWithAResponse) {
					messageWithAResponse.repliedMessage = messageSubjectOfReply;
				}
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
				initRoomChatsRegistry(draft, roomId);

				// Add date message if the new message has a different date than the previous one
				const lastMessageDate = last(draft.chatsRegistry[roomId].messages)?.date ?? 0;
				if (!datesAreFromTheSameDay(lastMessageDate, placeholderMessage.date)) {
					draft.chatsRegistry[roomId].messages.push({
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
						draft.chatsRegistry[roomId].messages,
						(message) =>
							message.type === MessageType.TEXT_MSG && message.stanzaId === messageSubjectOfReplyId
					) as TextMessage;
					if (messageSubjectOfReply) {
						placeholderMessage.repliedMessage = messageSubjectOfReply;
					}
				}

				// Add message to the end of list or replace a placeholder message
				draft.chatsRegistry[roomId].messages.push(placeholderMessage);

				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: placeholderMessage });
			}),
			false,
			'MESSAGES/SET_PLACEHOLDER_MESSAGE'
		);
	},
	removePlaceholderMessage: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				remove(draft.chatsRegistry[roomId].messages, (message) => message.id === messageId);
				if (
					draft.chatsRegistry[roomId].messages[draft.chatsRegistry[roomId].messages.length - 1]
						.type === MessageType.DATE_MSG
				) {
					draft.chatsRegistry[roomId].messages.pop();
				}
			}),
			false,
			'MESSAGES/REMOVE_PLACEHOLDER_MESSAGE'
		);
	},

	addFastening: (fastening: MessageFastening): void => {
		set(
			produce((draft: RootStore) => {
				// Create the fastenings object if it doesn't exist
				initRoomChatsRegistry(draft, fastening.roomId);
				if (!draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId]) {
					draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId] = [];
				}

				// Add fastening to the array only if it doesn't already exist
				if (
					!find(
						draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId],
						(f: MessageFastening) => f.id === fastening.id
					)
				) {
					draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId].push(
						fastening
					);
					draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId] = orderBy(
						draft.chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId],
						['date']
					);
				}
			}),
			false,
			'FASTENINGS/ADD_FASTENING'
		);
	},

	updateMarkers: (roomId: string, markers: Marker[]): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				forEach(markers, (marker: Marker) => {
					// Set new marker only when it's a new marker, or it is more recent than other
					const oldMarker = draft.chatsRegistry[roomId].markers[marker.from];
					if (!oldMarker || oldMarker.markerDate < marker.markerDate) {
						draft.chatsRegistry[roomId].markers[marker.from] = marker;
					}
				});
			}),
			false,
			'MARKERS/UPDATE_MARKER'
		);
	},

	addUnreadCount: (roomId: string, counter: number): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				const actualCounter = draft.chatsRegistry[roomId].unread || 0;
				draft.chatsRegistry[roomId].unread = actualCounter + counter;
			}),
			false,
			'UNREADS/ADD_UNREAD'
		);
	},
	updateUnreadCount: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				const { messages } = draft.chatsRegistry[roomId];
				const lastMarker =
					draft.chatsRegistry[roomId].markers &&
					draft.session.id !== undefined &&
					draft.chatsRegistry[roomId].markers[draft.session.id];
				const lastMarkedMessage = find(
					messages,
					(message: Message) => lastMarker && message.id === lastMarker.messageId
				);
				const isConfigurationMessage = (type: MessageType): boolean =>
					type === MessageType.CONFIGURATION_MSG;
				const isTextMessageFromOther = (message: Message): boolean =>
					message.type === MessageType.TEXT_MSG && !isMyId(message.from);
				const isAfterLastMarker = (date: number): boolean => {
					if (!lastMarker) return true;
					const dateToCompare = lastMarkedMessage ? lastMarkedMessage.date : lastMarker.markerDate;
					return !isBefore(date, dateToCompare);
				};
				const unreadByMe = filter(
					messages,
					(message) =>
						(isConfigurationMessage(message.type) || isTextMessageFromOther(message)) &&
						isAfterLastMarker(message.date)
				);
				draft.chatsRegistry[roomId].unread = size(unreadByMe);
			}),
			false,
			'UNREADS/UPDATE_UNREAD'
		);
	}
});
