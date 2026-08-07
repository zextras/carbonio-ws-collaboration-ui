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
	| WsMessageDeletedEvent;

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
