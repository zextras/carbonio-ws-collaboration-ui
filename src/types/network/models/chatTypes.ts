/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from './attachmentTypes';
import { RoomBe } from './roomBeTypes';

// ==================== MESSAGE TYPES ====================

export type ForwardedInfo = {
	originalSenderId: string;
	originalSentAt: string;
};

export type EditedInfo = {
	editedAt: string;
};

export type DeletedInfo = {
	deletedBy: string;
	deletedAt: string;
};

export type ChatMessage = {
	id: string;
	roomId: string;
	senderId: string;
	text: string;
	replyToId?: string;
	replyTo?: ChatMessageReply;
	forwardedInfo?: ForwardedInfo;
	editedInfo?: EditedInfo;
	deletedInfo?: DeletedInfo;
	reactions?: ReactionGroup[];
	attachment?: Attachment;
	createdAt: string;
};

export type ChatMessageReply = {
	id: string;
	senderId: string;
	text?: string;
	deleted: boolean;
};

export type ReactionGroup = {
	reaction: string;
	userIds: string[];
};

// ==================== PIN TYPES ====================

export type PinnedMessageResponse = {
	messageId: string;
	roomId: string;
	pinnedBy: string;
	pinnedAt: string;
	text: string;
	senderId: string;
};

// ==================== HISTORY/SEARCH TYPES ====================

export type MessageHistoryResponse = {
	messages: ChatMessage[];
	hasMore: boolean;
	cursor?: string;
};

export type MessageSearchResponse = {
	messages: ChatMessage[];
	hasMore: boolean;
	cursor?: string;
};

// ==================== TIMELINE TYPES ====================

export type SystemEventType =
	| 'ROOM_CREATED'
	| 'MEMBER_ADDED'
	| 'MEMBER_REMOVED'
	| 'MESSAGE_PINNED'
	| 'MESSAGE_UNPINNED'
	| 'MEETING_STARTED'
	| 'MEETING_ENDED'
	| 'MEETING_DECLINED';

export type SystemEvent = {
	id: string;
	roomId: string;
	type: SystemEventType;
	content: Record<string, unknown>;
	createdAt: string;
};

export type TimelineItemType = 'message' | 'system_event';

export type TimelineMessageItem = {
	itemType: 'message';
	createdAt: string;
	message: ChatMessage;
};

export type TimelineSystemEventItem = {
	itemType: 'system_event';
	createdAt: string;
	systemEvent: SystemEvent;
};

export type TimelineItem = TimelineMessageItem | TimelineSystemEventItem;

export type TimelineResponse = {
	items: TimelineItem[];
	markers?: ReadMarker[];
	hasMoreBefore: boolean;
	hasMoreAfter: boolean;
	cursorBefore?: string;
	cursorAfter?: string;
};

// ==================== READ MARKER TYPES ====================

export type ReadMarker = {
	userId: string;
	messageId: string;
	readAt: string;
};

export type RoomReadMarkers = {
	roomId: string;
	markers: ReadMarker[];
};

// ==================== INBOX TYPES ====================

export type InboxConversation = {
	roomId: string;
	room: RoomBe;
	lastMessage?: ChatMessage;
	lastEvent?: SystemEvent;
	unreadCount: number;
	muted: boolean;
	markers?: ReadMarker[];
};

export type InboxResponse = {
	conversations: InboxConversation[];
};

// ==================== PRESENCE TYPES ====================

// Backend returns { online: boolean, lastActivity?: string } per userId key
export type PresenceStatusEntry = {
	online: boolean;
	lastActivity?: string;
};

// Backend /presence/batch returns a map: { [userId: string]: PresenceStatusEntry }
// (additionalProperties in OpenAPI spec, NOT an array)
export type PresenceBatchResponse = Record<string, PresenceStatusEntry>;

// ==================== CONTACTS TYPES ====================

export type Contact = {
	userId: string;
	online: boolean;
	lastActivityAt?: string;
};

export type ContactsResponse = {
	contacts: Contact[];
};

// ==================== SSE EVENT TYPES ====================

export type ChatEventType =
	| 'connection_established'
	| 'message_new'
	| 'message_edited'
	| 'message_deleted'
	| 'reaction_added'
	| 'reaction_removed'
	| 'typing'
	| 'presence_changed'
	| 'read_marker_updated'
	| 'heartbeat';

export type BaseChatEvent = {
	type: ChatEventType;
	timestamp: string;
};

export type ConnectionEstablishedEvent = BaseChatEvent & {
	type: 'connection_established';
	connectionId: string;
};

export type MessageNewEvent = BaseChatEvent & {
	type: 'message_new';
	roomId: string;
	message: ChatMessage;
};

export type MessageEditedEvent = BaseChatEvent & {
	type: 'message_edited';
	roomId: string;
	message: ChatMessage;
};

export type MessageDeletedEvent = BaseChatEvent & {
	type: 'message_deleted';
	roomId: string;
	messageId: string;
	deletedBy: string;
	deletedAt: string;
};

export type ReactionAddedEvent = BaseChatEvent & {
	type: 'reaction_added';
	roomId: string;
	messageId: string;
	userId: string;
	reaction: string;
};

export type ReactionRemovedEvent = BaseChatEvent & {
	type: 'reaction_removed';
	roomId: string;
	messageId: string;
	userId: string;
	reaction: string;
};

/**
 * Typing ping event. Received every ~5 seconds while a user is typing.
 * If no ping is received for 10 seconds, the user is considered to have stopped typing.
 */
export type TypingEvent = BaseChatEvent & {
	type: 'typing';
	roomId: string;
	userId: string;
};

export type PresenceChangedEvent = BaseChatEvent & {
	type: 'presence_changed';
	userId: string;
	online: boolean;
	lastActivityAt?: string;
};

export type ReadMarkerUpdatedEvent = BaseChatEvent & {
	type: 'read_marker_updated';
	roomId: string;
	userId: string;
	messageId: string;
	readAt: string;
};

export type HeartbeatEvent = BaseChatEvent & {
	type: 'heartbeat';
};

export type ChatEvent =
	| ConnectionEstablishedEvent
	| MessageNewEvent
	| MessageEditedEvent
	| MessageDeletedEvent
	| ReactionAddedEvent
	| ReactionRemovedEvent
	| TypingEvent
	| PresenceChangedEvent
	| ReadMarkerUpdatedEvent
	| HeartbeatEvent;
