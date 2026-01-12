/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AttachmentType } from './attachmentTypes';
import { RoomBe } from './roomBeTypes';

// ==================== MESSAGE TYPES ====================

export type ChatMessage = {
	id: string;
	roomId: string;
	senderId: string;
	text: string;
	replyToId?: string;
	replyTo?: ChatMessageReply;
	forwarded: boolean;
	edited: boolean;
	deleted: boolean;
	deletedAt?: string;
	reactions?: ReactionGroup[];
	attachment?: AttachmentType;
	createdAt: string;
	updatedAt?: string;
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
	count: number;
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

export type SystemEventType = 'ROOM_CREATED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED';

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
	hasMore: boolean;
	cursor?: string;
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
	unreadCount: number;
	muted: boolean;
};

export type InboxResponse = {
	conversations: InboxConversation[];
};

// ==================== PRESENCE TYPES ====================

export type PresenceStatus = {
	userId: string;
	online: boolean;
	lastActivityAt?: string;
};

export type PresenceBatchResponse = {
	presences: PresenceStatus[];
};

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
	| 'typing_started'
	| 'typing_stopped'
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

export type TypingStartedEvent = BaseChatEvent & {
	type: 'typing_started';
	roomId: string;
	userId: string;
};

export type TypingStoppedEvent = BaseChatEvent & {
	type: 'typing_stopped';
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
	| TypingStartedEvent
	| TypingStoppedEvent
	| PresenceChangedEvent
	| ReadMarkerUpdatedEvent
	| HeartbeatEvent;
