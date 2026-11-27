/* eslint-disable no-param-reassign,no-plusplus */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, findIndex, forEach, map, orderBy, partition, remove, some, uniqBy } from 'lodash';
import { StateCreator } from 'zustand';

import { PLACEHOLDER_STANZA_PREFIX } from '../../constants/messageConstants';
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
import { isBefore, isStrictlyBefore } from '../../utils/dateUtils';
import { getIsWscPure } from '../selectors/SessionSelectors';

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

const compareMessageKeys = (
	a: Pick<Message, 'date' | 'id'>,
	b: Pick<Message, 'date' | 'id'>
): number => {
	if (a.date !== b.date) return a.date - b.date;
	if (a.id === b.id) return 0;
	return a.id < b.id ? -1 : 1;
};

const isPendingRow = (message: Message): boolean =>
	message.type === MessageType.TEXT_MSG && message.read === MarkerStatus.PENDING;

const sortedInsertIndex = (messages: Message[], message: Message): number => {
	let index = messages.length;
	if (isPendingRow(message)) return index;
	while (
		index > 0 &&
		(isPendingRow(messages[index - 1]) || compareMessageKeys(messages[index - 1], message) > 0)
	) {
		index -= 1;
	}
	return index;
};

/** v2: a live row at its sorted place, replacing the row with the same id (a placeholder). */
const landLiveRow = (
	messages: Message[],
	markers: ChatRegistry['markers'],
	message: Message
): void => {
	const row: Message =
		message.type === MessageType.TEXT_MSG &&
		message.read !== MarkerStatus.PENDING &&
		isMyId(message.from)
			? { ...message, read: calcReads(message.date, message.roomId, markers) }
			: message;
	const existingIndex = findIndex(messages, { id: message.id });
	if (existingIndex !== -1) {
		const [existing] = messages.splice(existingIndex, 1);
		Object.assign(existing, row);
		messages.splice(sortedInsertIndex(messages, existing), 0, existing);
	} else {
		messages.splice(sortedInsertIndex(messages, row), 0, row);
	}
};

// Module level so a registry wiped by a reset or a clear never repeats a token a request in flight holds
let searchGenerationCounter = 0;
let unreadStaleCounter = 0;

const initRoomChatsRegistry = (store: RootStore, roomId: string): ChatRegistry => {
	if (!store.chatsRegistry[roomId]) {
		store.chatsRegistry[roomId] = {
			messages: [],
			fastenings: {},
			markers: {},
			unread: 0,
			searchResults: [],
			backfillQueue: []
		};
	}
	return store.chatsRegistry[roomId];
};

export function mergeOverlappingRanges(ranges: MessageRange[]): MessageRange[] {
	if (ranges.length <= 1) return ranges;

	const merged: MessageRange[] = [ranges[0]];

	// eslint-disable-next-line no-plusplus
	for (let i = 1; i < ranges.length; i++) {
		const current = ranges[i];
		const last = merged[merged.length - 1];

		if (current.oldestTimestamp <= last.newestTimestamp) {
			if (current.newestTimestamp >= last.newestTimestamp) {
				last.newestId = current.newestId;
				last.newestTimestamp = current.newestTimestamp;
			}
		} else {
			merged.push(current);
		}
	}

	return merged;
}

const isFasteningAlreadyExists = (messageFastenings: MessageFastening[], id: string): boolean =>
	!!find(messageFastenings, (f) => f.id === id);

const addFasteningToMessage = (
	existingFastenings: Record<string, MessageFastening[]>,
	newFastening: MessageFastening
): void => {
	const { originalStanzaId, id } = newFastening;
	existingFastenings[originalStanzaId] ??= [];

	const messageFastening = existingFastenings[originalStanzaId];

	if (isFasteningAlreadyExists(messageFastening, id)) {
		return;
	}

	messageFastening.push(newFastening);
	existingFastenings[originalStanzaId] = orderBy(messageFastening, ['date']);
};

const isBackfillRequestExists = (queue: BackfillRequest[], request: BackfillRequest): boolean =>
	queue.some((req) => req.afterDate === request.afterDate && req.beforeDate === request.beforeDate);

const addBackfillRequestToQueue = (queue: BackfillRequest[], request: BackfillRequest): void => {
	if (isBackfillRequestExists(queue, request)) {
		return;
	}
	queue.push(request);
};

/**
 * Which messages after the own marker make the unread count: the others' text
 * messages, plus the configuration rows: all of them on v1, like MongooseIM
 * did, only the ones authored by others on v2, like the WSC backend counts the
 * system lines.
 */
const countsAsUnread = (msg: Message, isWscPure: boolean): boolean => {
	if (msg.type === MessageType.CONFIGURATION_MSG) {
		return !isWscPure || !isMyId(msg.from);
	}
	return msg.type === MessageType.TEXT_MSG && !isMyId(msg.from);
};

/**
 * A window that stops before the newest message cannot recount the unread rows after the marker.
 * A marker at or after the last message of the room reads everything; a move between two rows of
 * the window takes only the rows it passes from the server count; any other move leaves the
 * count to a refresh (`stale`).
 */
const unreadAfterMarkerMoved = (
	registry: ChatRegistry,
	myId: string,
	previousMarkerDate: number | undefined
): { unread: number; change: 'reset' | 'adjust' | 'stale' } => {
	const markerDate = registry.markers[myId]?.markerDate;
	if (!markerDate) return { unread: registry.unread, change: 'adjust' };
	if (registry.lastMessage && markerDate >= registry.lastMessage.date) {
		return { unread: 0, change: 'reset' };
	}
	const confirmedRows = registry.messages.filter((msg) => !isPendingRow(msg));
	const oldestDate = confirmedRows[0]?.date;
	const newestDate = confirmedRows[confirmedRows.length - 1]?.date;
	const insideWindow =
		previousMarkerDate !== undefined &&
		oldestDate !== undefined &&
		newestDate !== undefined &&
		previousMarkerDate >= oldestDate &&
		markerDate <= newestDate;
	if (!insideWindow) return { unread: registry.unread, change: 'stale' };
	const readNow = registry.messages.filter(
		(msg) =>
			countsAsUnread(msg, true) &&
			isStrictlyBefore(previousMarkerDate, msg.date) &&
			isBefore(msg.date, markerDate)
	).length;
	return { unread: Math.max(0, registry.unread - readNow), change: 'adjust' };
};

export const useChatsRegistryStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ChatsRegistryStoreSlice
> = (set, get) => ({
	chatsRegistry: {},
	windowEpochs: {},
	newMessage: (message: Message): void => {
		set(
			produce((draft: RootStore) => {
				const { messages, markers, hasMoreAfter } = initRoomChatsRegistry(draft, message.roomId);
				if (!getIsWscPure(draft)) {
					const alreadyExists = find(messages, { id: message.id });
					// Replace message if it already exists (placeholder message)
					if (alreadyExists) {
						Object.assign(alreadyExists, message);
					} else {
						messages.push(message);
					}
					return;
				}
				const existingIndex = findIndex(messages, { id: message.id });
				// A window that does not end at the newest message must not grow at the end: a hidden gap.
				// The row is read again with the pages that attach the window
				if (hasMoreAfter && existingIndex === -1) {
					return;
				}
				landLiveRow(messages, markers, message);
			}),
			false,
			'CHAT/NEW_MESSAGE'
		);
	},
	setInboxMessages: (inbox: Message[]): void => {
		set(
			produce((draft: RootStore) => {
				const isWscPure = getIsWscPure(draft);
				inbox.forEach((message) => {
					const registry = initRoomChatsRegistry(draft, message.roomId);
					if (
						message.type !== MessageType.TEXT_MSG &&
						message.type !== MessageType.CONFIGURATION_MSG
					) {
						registry.inboxMessageId = message.id;
						return;
					}
					const { lastMessage } = registry;
					if (
						!isWscPure ||
						!lastMessage ||
						lastMessage.id === message.id ||
						compareMessageKeys(message, lastMessage) > 0
					) {
						registry.inboxMessageId = message.id;
						registry.lastMessage = message;
					}
				});
			}),
			false,
			'CHAT/NEW_INBOX_MESSAGE'
		);
	},
	setLastMessage: (roomId: string, message: TextMessage | ConfigurationMessage): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId).lastMessage = message;
			}),
			false,
			'CHAT/SET_LAST_MESSAGE'
		);
	},
	updateHistory: (roomId: string, messageArray: Message[]): void => {
		set(
			produce((draft: RootStore) => {
				const { messages } = initRoomChatsRegistry(draft, roomId);
				if (messageArray.length > 0) {
					const isWscPure = getIsWscPure(draft);
					const compare = isWscPure
						? compareMessageKeys
						: (a: Message, b: Message): number => a.date - b.date;
					// On v2 the pending rows stay last, like in newMessage: their date is the client send time
					const [pendingRows, storedRows] = isWscPure
						? partition(messages, isPendingRow)
						: [[], messages];
					const [pendingPageRows, pageRows] = isWscPure
						? partition(messageArray, isPendingRow)
						: [[], messageArray];
					const newMessages = [...pageRows].sort(compare);
					const merged = mergeSortedArrays(newMessages, storedRows, compare);
					// Check for duplicates and remove them
					draft.chatsRegistry[roomId].messages = uniqBy(
						[...merged, ...pendingRows, ...pendingPageRows],
						'id'
					);
				}
			}),
			false,
			'CHAT/UPDATE_HISTORY'
		);
	},
	addCreateRoomMessage: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (!room) return;

				const { messages } = initRoomChatsRegistry(draft, roomId);
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
					messages.splice(0, 0, creationMsg);
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
					stanzaId: `${PLACEHOLDER_STANZA_PREFIX}${id}`,
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
				messages.push(placeholderMessage);

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
	addFastening: (newFastenings: MessageFastening[]): void => {
		if (newFastenings.length === 0) {
			return;
		}
		set(
			produce((draft: RootStore) => {
				const { fastenings } = initRoomChatsRegistry(draft, newFastenings[0].roomId);
				forEach(newFastenings, (newFastening) => addFasteningToMessage(fastenings, newFastening));
			}),
			false,
			'CHAT/ADD_FASTENING'
		);
	},
	updateReadStatus: (roomId: string, newMarkers: Marker[]): void => {
		const ownId = get().session.id;
		const previousOwnMarkerDate = ownId
			? get().chatsRegistry[roomId]?.markers[ownId]?.markerDate
			: undefined;
		set(
			produce((draft: RootStore) => {
				const { messages, markers, lastMessage, hasMoreAfter } = initRoomChatsRegistry(
					draft,
					roomId
				);

				// Set a member marker only when it's a new marker, or it is more recent than other
				const myId = draft.session.id;
				let ownMarkerChanged = false;
				forEach(newMarkers, (marker) => {
					const existing = markers[marker.from];
					if (!existing || isBefore(existing.markerDate, marker.markerDate)) {
						markers[marker.from] = marker;
					}
					if (
						marker.from === myId &&
						(!existing || isStrictlyBefore(existing.markerDate, marker.markerDate))
					) {
						ownMarkerChanged = true;
					}
				});

				// Update last message read status
				if (
					lastMessage &&
					[MessageType.TEXT_MSG, MessageType.CONFIGURATION_MSG].includes(lastMessage.type) &&
					[MarkerStatus.UNREAD, MarkerStatus.READ_BY_SOMEONE].includes(lastMessage.read)
				) {
					lastMessage.read = calcReads(lastMessage.date, roomId, markers);
				}

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

				// Recalculate unread count. On v2 only a marker of mine that moves changes it: the count comes from
				// the server, and the rows in store can be fewer than the unread ones because the history is not
				// preloaded. A history page repeats the markers it already knows
				const isWscPure = getIsWscPure(draft);
				if (isWscPure && !ownMarkerChanged) {
					return;
				}
				// A window that stops before the newest message cannot recount the unread rows after the
				// marker: take away the ones the marker just moved over
				if (isWscPure && hasMoreAfter && myId) {
					const moved = unreadAfterMarkerMoved(
						draft.chatsRegistry[roomId],
						myId,
						previousOwnMarkerDate
					);
					draft.chatsRegistry[roomId].unread = moved.unread;
					if (moved.change === 'stale') {
						unreadStaleCounter += 1;
						draft.chatsRegistry[roomId].unreadStale = unreadStaleCounter;
					} else if (moved.change === 'reset') {
						draft.chatsRegistry[roomId].unreadStale = undefined;
					}
					return;
				}
				const myMarker = myId ? draft.chatsRegistry[roomId]?.markers[myId] : undefined;
				const lastMarkedDate = myMarker
					? (find(messages, { id: myMarker.messageId })?.date ?? myMarker.markerDate)
					: undefined;

				const unreadMessages = messages.filter((msg) => {
					const isAfterMarker = !lastMarkedDate || msg.date > lastMarkedDate;
					return countsAsUnread(msg, isWscPure) && isAfterMarker;
				});

				draft.chatsRegistry[roomId].unread = unreadMessages.length;
			}),
			false,
			'CHAT/UPDATE_READ_STATUS'
		);
	},
	setUnreadCount: (roomId: string, count: number): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				registry.unread = count;
			}),
			false,
			'CHAT/SET_UNREAD_COUNT'
		);
	},
	clearUnreadStale: (roomId: string, version: number): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry?.unreadStale === version) {
					registry.unreadStale = undefined;
				}
			}),
			false,
			'CHAT/CLEAR_UNREAD_STALE'
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
	appendSearchResults: (roomId: string, results: TextMessage[]): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				// Results cleared meanwhile (panel closed, query reset): a late page has nothing to join
				if (registry.searchResults.length === 0) return;
				const knownIds = new Set(registry.searchResults.map((result) => result.id));
				registry.searchResults.push(...results.filter((result) => !knownIds.has(result.id)));
			}),
			false,
			'CHAT/APPEND_SEARCH_RESULTS'
		);
	},
	setSearchHasMore: (roomId: string, hasMore: boolean): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId).searchHasMore = hasMore;
			}),
			false,
			'CHAT/SET_SEARCH_HAS_MORE'
		);
	},
	beginSearch: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				searchGenerationCounter += 1;
				registry.searchGeneration = searchGenerationCounter;
			}),
			false,
			'CHAT/BEGIN_SEARCH'
		);
	},
	clearSearchResults: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId);
				draft.chatsRegistry[roomId].searchResults = [];
				draft.chatsRegistry[roomId].searchHasMore = false;
				searchGenerationCounter += 1;
				draft.chatsRegistry[roomId].searchGeneration = searchGenerationCounter;
				if (draft.activeConversations[roomId]) {
					draft.activeConversations[roomId].selectedSearchResult = undefined;
				}
			}),
			false,
			'CHAT/CLEAR_SEARCH_RESULTS'
		);
	},
	addMessageRange: (roomId: string, range: MessageRange): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				registry.messageRanges = mergeOverlappingRanges(
					orderBy([...(registry.messageRanges ?? []), range], ['oldestTimestamp'], ['asc'])
				);
			}),
			false,
			'CHAT/ADD_MESSAGE_RANGE'
		);
	},
	enqueueBackfill: (roomId: string, gaps: BackfillRequest[]): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				gaps.forEach((request) => addBackfillRequestToQueue(registry.backfillQueue, request));
			}),
			false,
			'CHAT/ENQUEUE_BACKFILL'
		);
	},
	clearMessages: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = initRoomChatsRegistry(draft, roomId);
				// Unconfirmed sends stay at the end of the window. Their confirmation is dropped while the
				// window is detached and comes back with the pages that attach it
				registry.messages = registry.messages.filter(isPendingRow);
				registry.hasMoreAfter = true;
				const conversation = draft.activeConversations[roomId];
				if (conversation) {
					conversation.isHistoryFullyLoaded = false;
				}
			}),
			false,
			'CHAT/CLEAR_MESSAGES'
		);
	},
	setHasMoreAfter: (roomId: string, hasMoreAfter: boolean): void => {
		set(
			produce((draft: RootStore) => {
				initRoomChatsRegistry(draft, roomId).hasMoreAfter = hasMoreAfter;
			}),
			false,
			'CHAT/SET_HAS_MORE_AFTER'
		);
	},
	shiftBackfillQueue: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.chatsRegistry[roomId].backfillQueue.shift();
			}),
			false,
			'CHAT/BACKFILL_REQUEST_PROCESSED'
		);
	}
});
