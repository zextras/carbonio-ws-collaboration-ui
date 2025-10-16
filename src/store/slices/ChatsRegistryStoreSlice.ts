/* eslint-disable no-param-reassign,no-plusplus */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, forEach, map, orderBy, remove, size, some, uniqBy } from 'lodash';
import { StateCreator } from 'zustand';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { isMyId } from '../../network/websocket/eventHandlersUtilities';
import {
	BackfillRequest,
	ChatRegistry,
	ChatsRegistryStoreSlice,
	ConfigurationMessage,
	Marker,
	MarkerStatus,
	Message,
	MessageFastening,
	MessageRange,
	MessageType,
	OperationType,
	PlaceholderFields,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { calcReads } from '../../utils/calcReads';
import { isBefore } from '../../utils/dateUtils';

function mergeSortedArrays<T>(arr1: T[], arr2: T[], compareFn: (a: T, b: T) => number): T[] {
	const result: T[] = [];
	let i = 0;
	let j = 0;

	while (i < arr1.length && j < arr2.length) {
		if (compareFn(arr1[i], arr2[j]) <= 0) {
			result.push(arr1[i++]);
		} else {
			result.push(arr2[j++]);
		}
	}

	while (i < arr1.length) result.push(arr1[i++]);
	while (j < arr2.length) result.push(arr2[j++]);

	return result;
}

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

function mergeOverlappingRanges(ranges: MessageRange[]): MessageRange[] {
	if (ranges.length <= 1) return ranges;

	const merged: MessageRange[] = [ranges[0]];

	// eslint-disable-next-line no-plusplus
	for (let i = 1; i < ranges.length; i++) {
		const current = ranges[i];
		const last = merged[merged.length - 1];

		if (current.oldestTimestamp <= last.newestTimestamp) {
			if (current.newestTimestamp > last.newestTimestamp) {
				last.newestStanzaId = current.newestStanzaId;
				last.newestTimestamp = current.newestTimestamp;
			}
			last.count += current.count;
		} else {
			merged.push(current);
		}
	}

	return merged;
}

export const useChatsRegistryStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ChatsRegistryStoreSlice
> = (set, get) => ({
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
				const newMessages = orderBy(messageArray, ['date'], ['asc']);
				if (size(newMessages) > 0) {
					const merged = mergeSortedArrays(newMessages, messages, (a, b) => a.date - b.date);
					// Check for duplicates and remove them
					draft.chatsRegistry[roomId].messages = uniqBy(merged, 'id');
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
						id: `creationMessage-${firstMessageDate}`,
						roomId,
						date: firstMessageDate - 1,
						type: MessageType.CONFIGURATION_MSG,
						operation: OperationType.ROOM_CREATION,
						value: '',
						from: '',
						read: MarkerStatus.READ
					};
					draft.chatsRegistry[roomId].messages.splice(0, 0, creationMsg);
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
				draft.activeConversations[roomId].selectedSearchResult = undefined;
			}),
			false,
			'CHAT/CLEAR_SEARCH_RESULTS'
		);
	},

	addMessageRange: (roomId: string, range: MessageRange): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (!registry) return;

				registry.messageRanges ??= [];

				registry.messageRanges.push(range);
				registry.messageRanges = orderBy(registry.messageRanges, ['oldestTimestamp'], ['asc']);

				registry.messageRanges = mergeOverlappingRanges(registry.messageRanges);
			}),
			false,
			'CHAT/ADD_MESSAGE_RANGE'
		);
	},

	detectAndFillGaps: (roomId: string): void => {
		const state = get();
		const registry = state.chatsRegistry[roomId];

		if (!registry?.messageRanges || registry.messageRanges.length < 2) return;

		const gaps: BackfillRequest[] = [];

		// eslint-disable-next-line no-plusplus
		for (let i = 0; i < registry.messageRanges.length - 1; i++) {
			const older = registry.messageRanges[i];
			const newer = registry.messageRanges[i + 1];

			if (newer.oldestTimestamp > older.newestTimestamp) {
				gaps.push({
					afterStanzaId: older.newestStanzaId,
					beforeStanzaId: newer.oldestStanzaId
				});
			}
		}

		gaps.forEach((gap) => {
			get().enqueueBackfill(roomId, gap);
		});
	},

	enqueueBackfill: (roomId: string, request: BackfillRequest): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (!registry) return;

				registry.backfillQueue ??= [];

				const exists = registry.backfillQueue.some(
					(req) =>
						req.afterStanzaId === request.afterStanzaId &&
						req.beforeStanzaId === request.beforeStanzaId
				);

				if (!exists) {
					registry.backfillQueue.push(request);
				}
			}),
			false,
			'CHAT/ENQUEUE_BACKFILL'
		);
	},

	setBackfillInProgress: (roomId: string, inProgress: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry) {
					registry.backfillInProgress = inProgress;
				}
			}),
			false,
			'CHAT/SET_BACKFILL_IN_PROGRESS'
		);
	},

	processBackfillQueue: async (roomId: string): Promise<void> => {
		const state = get();
		const registry = state.chatsRegistry[roomId];

		if (
			!registry?.backfillQueue ||
			registry.backfillQueue.length === 0 ||
			registry.backfillInProgress
		) {
			return;
		}

		get().setBackfillInProgress(roomId, true);

		const request = registry.backfillQueue[0];

		try {
			state.connections.xmppClient.requestHistoryBetweenTwoIds(
				roomId,
				request.afterStanzaId,
				request.beforeStanzaId
			);

			set(
				produce((draft: RootStore) => {
					const reg = draft.chatsRegistry[roomId];
					if (reg?.backfillQueue) {
						reg.backfillQueue.shift();
					}
				}),
				false,
				'CHAT/BACKFILL_REQUEST_PROCESSED'
			);
		} catch (error) {
			console.error(`[Backfill] Error: ${error}`);

			set(
				produce((draft: RootStore) => {
					const reg = draft.chatsRegistry[roomId];
					if (reg?.backfillQueue) {
						reg.backfillQueue.shift();
					}
				}),
				false,
				'CHAT/BACKFILL_REQUEST_FAILED'
			);
		} finally {
			get().setBackfillInProgress(roomId, false);

			const updatedRegistry = get().chatsRegistry[roomId];
			if (updatedRegistry?.backfillQueue && updatedRegistry.backfillQueue.length > 0) {
				setTimeout(() => get().processBackfillQueue(roomId), 200);
			}
		}
	}
});
