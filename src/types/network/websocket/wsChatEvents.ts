/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type {
	WireMessageDeletedEvent,
	WireMessageEditedEvent,
	WireMessageForwardedEvent,
	WireMessagePinnedEvent,
	WireMessageReceivedEvent,
	WireMessageUnpinnedEvent,
	WirePresenceChangedEvent,
	WireReactionChangedEvent,
	WireReadUpdatedEvent,
	WireTypingEvent,
	WireWsErrorEvent
} from '@zextras/carbonio-ws-collaboration-sdk';

import { WsEventType } from './wsEvents';

/**
 * WSC-pure chat events (backend >= 2.0.0, MongooseIM replacement). The shapes
 * are the SDK's, generated from asyncapi.yaml (the SDK tracks the spec drift
 * in specs/SPEC_SOURCE.md): this file only adds the discriminant on the app's
 * event-type enum, so the router hands the SDK each event as it came off the
 * wire, `sentDate` included.
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
	| WsTypingEvent
	| WsErrorEvent;

export type WsPresenceChangedEvent = WirePresenceChangedEvent & {
	type: WsEventType.PRESENCE_CHANGED;
};

export type WsReadUpdatedEvent = WireReadUpdatedEvent & { type: WsEventType.READ_UPDATED };

/**
 * The full `TimelineMessage`, attachment and depth-1 quote included. `tempId`
 * reaches every member, but only the sender holds a placeholder under it.
 */
export type WsMessageReceivedEvent = WireMessageReceivedEvent & {
	type: WsEventType.MESSAGE_RECEIVED;
};

/** The new message in the destination room, with `forwardedInfo` and the attachment clone. */
export type WsMessageForwardedEvent = WireMessageForwardedEvent & {
	type: WsEventType.MESSAGE_FORWARDED;
};

/** No sender on the wire: only the author can edit. */
export type WsMessageEditedEvent = WireMessageEditedEvent & { type: WsEventType.MESSAGE_EDITED };

export type WsMessageDeletedEvent = WireMessageDeletedEvent & {
	type: WsEventType.MESSAGE_DELETED;
};

/**
 * Content-free (no text, no sender, no persisted system-event id): the banner
 * hydrates from the store when the target is loaded, from GET /rooms/{id}/pin
 * otherwise. Broadcast to the pinner too — the only confirmation path.
 */
export type WsMessagePinnedEvent = WireMessagePinnedEvent & { type: WsEventType.MESSAGE_PINNED };

export type WsMessageUnpinnedEvent = WireMessageUnpinnedEvent & {
	type: WsEventType.MESSAGE_UNPINNED;
};

/** Relayed to every member but the typist; the backend normalizes `status`. */
export type WsTypingEvent = WireTypingEvent & { type: WsEventType.TYPING };

/** A per-user reaction delta, not the aggregated state. */
export type WsReactionChangedEvent = WireReactionChangedEvent & {
	type: WsEventType.REACTION_CHANGED;
};

/** The backend refused an action this client sent on the socket (typing, unknown action). */
export type WsErrorEvent = WireWsErrorEvent & { type: WsEventType.WS_ERROR };
