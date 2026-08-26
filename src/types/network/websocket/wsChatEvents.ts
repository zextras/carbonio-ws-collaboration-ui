/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsEventType } from './wsEvents';

/**
 * WSC-pure chat events (backend >= 2.0.0, MongooseIM replacement). The shapes
 * come from the backend implementation via the frontend spike: the chat-event
 * family is not in asyncapi.yaml yet (the SDK tracks the drift in
 * specs/SPEC_SOURCE.md). One member lands per migration step, matching the
 * SDK handler it is routed to.
 */
export type WsChatEvent =
	| WsPresenceChangedEvent
	| WsReadUpdatedEvent
	| WsMessageReceivedEvent
	| WsMessageEditedEvent
	| WsMessageDeletedEvent
	| WsReactionChangedEvent
	| WsMessageForwardedEvent
	| WsMessagePinnedEvent
	| WsMessageUnpinnedEvent
	| WsTypingEvent;

export type WsPresenceChangedEvent = {
	type: WsEventType.PRESENCE_CHANGED;
	userId: string;
	online: boolean;
};

export type WsReadUpdatedEvent = {
	type: WsEventType.READ_UPDATED;
	roomId: string;
	userId: string;
	messageId: string;
};

export type WsMessageReceivedEvent = {
	type: WsEventType.MESSAGE_RECEIVED;
	messageId: string;
	roomId: string;
	senderId: string;
	text: string;
	timestamp: string;
	replyToId?: string;
	/** Client-generated correlation key: present on the sender's own echo. */
	tempId?: string;
	/** Defensive dual-path: the original author, when this delivery is actually a forward. */
	forwardedFrom?: string;
	forwardedAt?: string;
};

export type WsMessageForwardedEvent = {
	type: WsEventType.MESSAGE_FORWARDED;
	messageId: string;
	roomId: string;
	/** The room the message was forwarded from. */
	originalRoomId: string;
	senderId: string;
	text: string;
	/** Optional in the spike's shape: the SDK falls back to the arrival instant. */
	timestamp?: string;
	forwardedFrom?: string;
	forwardedAt?: string;
};

export type WsMessageEditedEvent = {
	type: WsEventType.MESSAGE_EDITED;
	messageId: string;
	roomId: string;
	senderId: string;
	/** The full new text, not a delta. */
	text: string;
	editedAt: string;
};

export type WsMessageDeletedEvent = {
	type: WsEventType.MESSAGE_DELETED;
	messageId: string;
	roomId: string;
	senderId: string;
	deletedAt: string;
};

/**
 * Content-free (no text, no sender, no persisted system-event id): the banner
 * hydrates from the store when the target is loaded, from GET /rooms/{id}/pin
 * otherwise. Broadcast to the pinner too — the only confirmation path.
 */
export type WsMessagePinnedEvent = {
	type: WsEventType.MESSAGE_PINNED;
	roomId: string;
	messageId: string;
	pinnedBy: string;
	timestamp: string;
};

export type WsMessageUnpinnedEvent = {
	type: WsEventType.MESSAGE_UNPINNED;
	roomId: string;
	messageId: string;
	unpinnedBy: string;
	timestamp: string;
};

/**
 * A member's typing state changed. `status` is optional on the wire and a
 * missing value means `started` (spike contract); the timestamp is unused —
 * the indicator lifecycle is arrival instant + the SDK's auto-expire.
 */
export type WsTypingEvent = {
	type: WsEventType.TYPING;
	roomId: string;
	userId: string;
	status?: 'started' | 'stopped';
	timestamp: string;
};

/** A per-user reaction delta, not the aggregated state. */
export type WsReactionChangedEvent = {
	type: WsEventType.REACTION_CHANGED;
	messageId: string;
	roomId: string;
	userId: string;
	reaction: string;
	operation: 'added' | 'removed';
};
