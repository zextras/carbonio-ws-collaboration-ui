/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { concat, find, forEach, last, map, orderBy, remove, size, some, uniqBy } from 'lodash';
import { StateCreator } from 'zustand';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { isMyId } from '../../network/websocket/eventHandlersUtilities';
import {
	ChatRegistry,
	ChatsRegistryStoreSlice,
	ConfigurationMessage,
	DateMessage,
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
import { datesAreFromTheSameDay, isBefore, isStrictlyBefore, now } from '../../utils/dateUtils';

const initRoomChatsRegistry = (store: RootStore, roomId: string): ChatRegistry => {
	if (!store.chatsRegistry[roomId]) {
		store.chatsRegistry[roomId] = {
			messages: [],
			fastenings: {},
			markers: {},
			unread: 0,
			searchResults: []
		};
	}
	return store.chatsRegistry[roomId];
};

const addDateMessage = (messages: Message[], messageDate: number, roomId: string): void => {
	const lastDate = last(messages)?.date ?? 0;
	if (!datesAreFromTheSameDay(lastDate, messageDate)) {
		messages.push({
			id: `dateMessage-${messageDate - 2}`,
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
				const { messages } = initRoomChatsRegistry(draft, message.roomId);
				const alreadyExists = find(messages, { id: message.id });
				// Replace message if it already exists (placeholder message)
				if (alreadyExists) {
					Object.assign(alreadyExists, message);
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
				const { messages } = initRoomChatsRegistry(draft, message.roomId);
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
				const { messages } = initRoomChatsRegistry(draft, roomId);

				// Process only new messages in ascending order
				const newMessages = orderBy(messageArray, ['date'], ['asc']).filter((msg) =>
					isStrictlyBefore(msg.date, messages[0]?.date || now())
				);

				if (size(newMessages) > 0) {
					// Add date between messages of different days
					const newMessagesWithDates = newMessages.reduce<Message[]>((acc, message, index) => {
						const prevDate = newMessages[index - 1]?.date ?? 0;
						if (!datesAreFromTheSameDay(prevDate, message.date)) {
							acc.push({
								id: `dateMessage-${message.date - 2}`,
								roomId,
								date: message.date - 2,
								type: MessageType.DATE_MSG
							} as DateMessage);
						}
						acc.push(message);
						return acc;
					}, []);

					// Remove old first date message if the last message of the new history has the same date
					if (
						messages[0]?.type === MessageType.DATE_MSG &&
						datesAreFromTheSameDay(messages[0].date, last(newMessagesWithDates)?.date ?? 0)
					) {
						remove(messages, (message) => message.id === messages[0].id);
					}

					draft.chatsRegistry[roomId].messages = concat(
						newMessagesWithDates,
						draft.chatsRegistry[roomId].messages
					);

					// Check for duplicates and remove them (inbox can contain duplicates for date differentiation)
					draft.chatsRegistry[roomId].messages = uniqBy(draft.chatsRegistry[roomId].messages, 'id');
				}
			}),
			false,
			'CHAT/UPDATE_HISTORY'
		);
	},
	addCreateRoomMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const { messages } = draft.chatsRegistry[roomId];
				const room = draft.rooms[roomId];

				const alreadyHasCreationMsg = some(
					messages,
					(message) =>
						message.type === MessageType.CONFIGURATION_MSG &&
						message.operation === OperationType.ROOM_CREATION
				);
				const isHistoryCleared = Boolean(room.userSettings?.clearedAt);
				const firstMessageDate = messages[0]?.date;

				// Add creation message only if the room is a non-empty group without the history cleared
				if (
					room.type === RoomType.GROUP &&
					firstMessageDate &&
					!alreadyHasCreationMsg &&
					!isHistoryCleared
				) {
					const creationMsg: ConfigurationMessage = {
						id: `creationMessage-${firstMessageDate + 1}`,
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
			'CHAT/CREATE_ROOM_MESSAGE'
		);
	},
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string, // id of message which contains the replyMessage and replyTo fields
		messageSubjectOfReply: TextMessage // message not in history which will be placed as replyMessage if not edited/deleted
	): void => {
		set(
			produce((draft: RootStore) => {
				const { messages } = initRoomChatsRegistry(draft, roomId);
				const messageWithAResponse = find(
					messages,
					(message) => message.id === replyMessageId
				) as TextMessage;
				if (messageWithAResponse) {
					messageWithAResponse.repliedMessage = messageSubjectOfReply;
				}
			}),
			false,
			'CHAT/SET_REPLIED_MESSAGE'
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
				const { messages } = initRoomChatsRegistry(draft, roomId);

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

				// Add date message if the new message has a different date than the previous one
				addDateMessage(messages, placeholderMessage.date, roomId);

				// If the placeholder message is a reply, find the message to reply to
				if (placeholderMessage.replyTo) {
					const messageSubjectOfReply = find(
						messages,
						(message) =>
							message.type === MessageType.TEXT_MSG &&
							message.stanzaId === placeholderMessage.replyTo
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
			'CHAT/SET_PLACEHOLDER_MESSAGE'
		);
	},
	removePlaceholderMessage: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				const { messages } = initRoomChatsRegistry(draft, roomId);
				remove(messages, (message) => message.id === messageId);
				if (last(messages)?.type === MessageType.DATE_MSG) {
					draft.chatsRegistry[roomId].messages.pop();
				}
			}),
			false,
			'CHAT/REMOVE_PLACEHOLDER_MESSAGE'
		);
	},
	addFastening: (fastening: MessageFastening): void => {
		set(
			produce((draft: RootStore) => {
				const { fastenings } = initRoomChatsRegistry(draft, fastening.roomId);
				if (!fastenings[fastening.originalStanzaId]) {
					fastenings[fastening.originalStanzaId] = [];
				}
				const messageFastening = fastenings[fastening.originalStanzaId];
				const alreadyExists = find(messageFastening, (f) => f.id === fastening.id);
				// Add fastening to the array only if it doesn't already exist
				if (!alreadyExists) {
					messageFastening.push(fastening);
					fastenings[fastening.originalStanzaId] = orderBy(messageFastening, ['date']);
				}
			}),
			false,
			'CHAT/ADD_FASTENING'
		);
	},
	updateReadStatus: (roomId: string, newMarkers: Marker[]): void => {
		set(
			produce((draft: RootStore) => {
				const { messages, markers } = initRoomChatsRegistry(draft, roomId);

				// Set a member marker only when it's a new marker, or it is more recent than other
				forEach(newMarkers, (marker) => {
					const existing = markers[marker.from];
					if (!existing || isBefore(existing.markerDate, marker.markerDate)) {
						markers[marker.from] = marker;
					}
				});

				// Update messages' read status of TEXT and CONFIGURATION messages
				draft.chatsRegistry[roomId].messages = map(messages, (msg) => {
					if (
						(msg.type === MessageType.TEXT_MSG || msg.type === MessageType.CONFIGURATION_MSG) &&
						(msg.read === MarkerStatus.UNREAD || msg.read === MarkerStatus.READ_BY_SOMEONE)
					) {
						msg.read = calcReads(msg.date, roomId, markers);
					}
					return msg;
				});

				// Recalculate unread count
				const myId = draft.session.id;
				const myMarker = myId ? draft.chatsRegistry[roomId].markers[myId] : undefined;
				const lastMarkedDate = myMarker
					? (find(messages, { id: myMarker.messageId })?.date ?? myMarker.markerDate)
					: undefined;

				const unreadMessages = messages.filter((msg) => {
					const isConfigOrFromOthers =
						msg.type === MessageType.CONFIGURATION_MSG ||
						(msg.type === MessageType.TEXT_MSG && !isMyId(msg.from));
					const isAfterMarker = !lastMarkedDate || msg.date > lastMarkedDate;
					return isConfigOrFromOthers && isAfterMarker;
				});

				draft.chatsRegistry[roomId].unread = unreadMessages.length;
			}),
			false,
			'CHAT/UPDATE_READ_STATUS'
		);
	},
	incrementUnreadCount: (roomId: string, counter: number): void => {
		set(
			produce((draft: RootStore) => {
				const { unread } = initRoomChatsRegistry(draft, roomId);
				draft.chatsRegistry[roomId].unread = unread + counter;
			}),
			false,
			'CHAT/INCREMENT_UNREAD'
		);
	},
	setSearchResults: (roomId: string, results: TextMessage[]): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				draft.chatsRegistry[roomId].searchResults = results;
			}),
			false,
			'CHAT/SET_SEARCH_RESULTS'
		);
	},
	clearSearchResults: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				draft.chatsRegistry[roomId].searchResults = [];
			}),
			false,
			'CHAT/CLEAR_SEARCH_RESULTS'
		);
	}
});
