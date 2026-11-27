/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ChatsRegistryStoreSlice = {
	chatsRegistry: { [roomId: string]: ChatRegistry };
	/** Bumped by a reconnection reset ('*') and by a history clear (room): in-flight window loads check it. */
	windowEpochs: { [roomIdOrAll: string]: number };
	newMessage: (message: Message) => void;
	setInboxMessages: (message: Message[]) => void;
	setLastMessage: (roomId: string, message: TextMessage | ConfigurationMessage) => void;
	updateHistory: (roomId: string, messageArray: Message[]) => void;
	addCreateRoomMessage: (roomId: string) => void;
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string,
		messageSubjectOfReply: TextMessage
	) => void;
	setPlaceholderMessage: (fields: PlaceholderFields) => void;
	removePlaceholderMessage: (roomId: string, messageId: string) => void;
	addFastening: (fasteningMessage: MessageFastening[]) => void;
	updateReadStatus: (roomId: string, newMarkers: Marker[]) => void;
	setUnreadCount: (roomId: string, count: number) => void;
	incrementUnreadCount: (roomId: string, counter: number) => void;
	setSearchResults: (roomId: string, results: TextMessage[]) => void;
	appendSearchResults: (roomId: string, results: TextMessage[]) => void;
	setSearchHasMore: (roomId: string, hasMore: boolean) => void;
	clearSearchResults: (roomId: string) => void;
	addMessageRange: (roomId: string, range: MessageRange) => void;
	enqueueBackfill: (roomId: string, gaps: BackfillRequest[]) => void;
	shiftBackfillQueue: (roomId: string) => void;
	clearMessages: (roomId: string) => void;
	setHasMoreAfter: (roomId: string, hasMoreAfter: boolean) => void;
};

export type ChatRegistry = {
	unread: number;
	inboxMessageId?: string;
	lastMessage?: TextMessage | ConfigurationMessage;
	messages: Message[];
	fastenings: { [stanzaId: string]: MessageFastening[] };
	markers: { [userId: string]: Marker };
	searchResults: TextMessage[];
	searchHasMore?: boolean;
	/**
	 * The loaded window does not end at the newest message (a jump replaced it): live messages are
	 * not appended to it until the forward pages reach the newest message again.
	 */
	hasMoreAfter?: boolean;
	/** Live rows not appended to a detached window: they join it when it reaches the newest message. */
	detachedBuffer?: Message[];
	/** The unread count could not follow an own marker move on a detached window: refresh it. */
	unreadStale?: boolean;
	messageRanges?: MessageRange[];
	backfillQueue: BackfillRequest[];
};

export type Message = TextMessage | ConfigurationMessage | MessageFastening;

export type ExtendedMessage = Message | DateMessage;

export type BasicMessage = {
	// aka ARCHIVE-ID more external one
	id: string;
	roomId: string;
	date: number;
};

export type TextMessage = BasicMessage & {
	// aka the id inside <stanza-id> tag
	stanzaId: string;
	type: MessageType.TEXT_MSG;
	from: string;
	text: string;
	read: MarkerStatus;
	edited?: boolean;
	deleted?: boolean;
	replyTo?: string;
	repliedMessage?: TextMessage;
	forwarded?: ForwardedInfo;
	attachment?: AttachmentMessageType;
	editedStanzaId?: string;
};

export type ConfigurationMessage = BasicMessage & {
	type: MessageType.CONFIGURATION_MSG;
	operation: OperationType;
	value: string;
	from: string;
	read: MarkerStatus;
};

export interface MessageRange {
	oldestId: string;
	newestId: string;
	oldestTimestamp: number;
	newestTimestamp: number;
}

export interface BackfillRequest {
	afterDate: number;
	beforeDate: number;
}

export enum OperationType {
	ROOM_NAME_CHANGED = 'roomNameChanged',
	ROOM_DESCRIPTION_CHANGED = 'roomDescriptionChanged',
	ROOM_PICTURE_UPDATED = 'roomPictureUpdated',
	ROOM_PICTURE_DELETED = 'roomPictureDeleted',
	MEMBER_ADDED = 'memberAdded',
	MEMBER_REMOVED = 'memberRemoved',
	ROOM_CREATION = 'roomCreation',
	MESSAGE_PINNED = 'messagePinned',
	MESSAGE_UNPINNED = 'messageUnpinned',
	MESSAGE_PIN_UPDATED = 'messagePinUpdated',
	CLEARED_HISTORY = 'roomHistoryCleared',
	MEETING_STARTED = 'meetingStarted',
	MEETING_ENDED = 'meetingEnded',
	MEETING_DECLINED = 'meetingDeclined'
}

export enum MarkerStatus {
	READ = 'read',
	READ_BY_SOMEONE = 'read_by_someone',
	UNREAD = 'unread',
	PENDING = 'pending'
}

export type DateMessage = BasicMessage & {
	type: MessageType.DATE_MSG;
};

export type MessageFastening = BasicMessage & {
	type: MessageType.FASTENING;
	action: FasteningAction;
	originalStanzaId: string;
	from: string;
	value?: string;
	stanzaId: string;
};

export enum FasteningAction {
	DELETE = 'delete',
	EDIT = 'edit',
	REACTION = 'reaction'
}

export enum MessageType {
	TEXT_MSG = 'text',
	CONFIGURATION_MSG = 'configuration',
	DATE_MSG = 'date',
	FASTENING = 'fastening'
}

export type ForwardedInfo = {
	id: string;
	date: number;
	from: string;
	count: number;
};

export type AttachmentMessageType = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	area?: string;
};

export type PlaceholderFields = {
	id: string;
	roomId: string;
	text: string;
	replyTo?: string;
	forwarded?: ForwardedInfo;
	attachment?: AttachmentMessageType;
};

export type Marker = {
	from: string;
	messageId: string;
	markerDate: number;
	type: 'displayed';
};
