/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ChatsRegistryStoreSlice = {
	chatsRegistry: { [roomId: string]: ChatRegistry };
	newMessage: (message: Message) => void;
	newInboxMessage: (message: Message) => void;
	setInboxMessages: (message: Message[]) => void;
	setLastMessageForInbox: (roomId: string, message: Message) => void;
	setLastMessage: (roomId: string, message: TextMessage | ConfigurationMessage) => void;
	updateHistory: (roomId: string, messageArray: Message[], markers?: Marker[]) => void;
	addCreateRoomMessage: (roomId: string) => void;
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string,
		messageSubjectOfReply: TextMessage
	) => void;
	setPlaceholderMessage: (fields: PlaceholderFields) => void;
	removePlaceholderMessage: (roomId: string, messageId: string) => void;
	addFastening: (fasteningMessage: MessageFastening[]) => void;
	removeFastening: (roomId: string, messageId: string, fasteningId: string) => void;
	updateReadStatus: (roomId: string, newMarkers: Marker[]) => void;
	setUnreadCount: (roomId: string, count: number) => void;
	incrementUnreadCount: (roomId: string, counter: number) => void;
	decrementUnreadCount: (roomId: string, counter: number) => void;
	setSearchResults: (roomId: string, results: TextMessage[]) => void;
	clearSearchResults: (roomId: string) => void;
	addMessageRange: (roomId: string, range: MessageRange) => void;
	enqueueBackfill: (roomId: string, gaps: BackfillRequest[]) => void;
	shiftBackfillQueue: (roomId: string) => void;
	setHasMoreBefore: (roomId: string, hasMore: boolean) => void;
	setHasMoreAfter: (roomId: string, hasMore: boolean) => void;
	clearMessages: (roomId: string) => void;
	setIsLoadingTimeline: (roomId: string, isLoading: boolean) => void;
};

export type ChatRegistry = {
	unread: number;
	inboxMessageId?: string;
	lastMessage?: TextMessage | ConfigurationMessage;
	messages: Message[];
	fastenings: { [stanzaId: string]: MessageFastening[] };
	markers: { [userId: string]: Marker };
	searchResults: TextMessage[];
	messageRanges?: MessageRange[];
	backfillQueue: BackfillRequest[];
	hasMoreBefore?: boolean;
	hasMoreAfter?: boolean;
	isLoadingTimeline?: boolean;
	// Last message received via SSE - used for inbox display when viewing historical pages
	lastMessageForInbox?: Message;
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
	editedInfo?: EditedInfo;
	deletedInfo?: DeletedInfo;
	replyTo?: string;
	repliedMessage?: TextMessage;
	forwardedInfo?: ForwardedInfo;
	attachment?: AttachmentMessageType;
	editedStanzaId?: string;
	/** @deprecated Use editedInfo instead */
	edited?: boolean;
	/** @deprecated Use deletedInfo instead */
	deleted?: boolean;
	/** @deprecated Use forwardedInfo instead */
	forwarded?: ForwardedInfo;
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
	originalSenderId?: string;
	originalSentAt?: string;
	/** @deprecated Use originalSenderId */
	from?: string;
	/** @deprecated Use originalSentAt */
	date?: number;
	/** @deprecated Forwarding count (old format) */
	count?: number;
	/** @deprecated Old id field */
	id?: string;
};

export type EditedInfo = {
	editedAt: string;
};

export type DeletedInfo = {
	deletedBy: string;
	deletedAt: string;
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
	forwardedInfo?: ForwardedInfo;
	attachment?: AttachmentMessageType;
};

export type Marker = {
	from: string;
	messageId: string;
	markerDate: number;
	type: 'displayed';
};
