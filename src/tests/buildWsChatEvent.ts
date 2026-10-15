/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { WireTimelineMessage } from '@zextras/carbonio-ws-collaboration-sdk';
import {
	buildMessageDeletedEvent,
	buildMessageEditedEvent,
	buildMessageForwardedEvent,
	buildMessagePinnedEvent,
	buildMessageReceivedEvent,
	buildMessageUnpinnedEvent,
	buildPresenceChangedEvent,
	buildReactionChangedEvent,
	buildReadUpdatedEvent,
	buildTypingEvent
} from '@zextras/carbonio-ws-collaboration-sdk/testing';

import type {
	WsErrorEvent,
	WsMessageDeletedEvent,
	WsMessageEditedEvent,
	WsMessageForwardedEvent,
	WsMessagePinnedEvent,
	WsMessageReceivedEvent,
	WsMessageUnpinnedEvent,
	WsPresenceChangedEvent,
	WsReactionChangedEvent,
	WsReadUpdatedEvent,
	WsTypingEvent
} from '../types/network/websocket/wsChatEvents';
import { WsEventType } from '../types/network/websocket/wsEvents';

/**
 * The WSC-pure chat events as the router receives them: the SDK fixtures,
 * typed on the asyncapi schemas (`sentDate` included), with the discriminant
 * swapped to the app's event-type enum.
 */

export const buildWsPresenceChangedEvent = (
	overrides?: Parameters<typeof buildPresenceChangedEvent>[0]
): WsPresenceChangedEvent => ({
	...buildPresenceChangedEvent(overrides),
	type: WsEventType.PRESENCE_CHANGED
});

export const buildWsReadUpdatedEvent = (
	overrides?: Parameters<typeof buildReadUpdatedEvent>[0]
): WsReadUpdatedEvent => ({
	...buildReadUpdatedEvent(overrides),
	type: WsEventType.READ_UPDATED
});

export const buildWsMessageReceivedEvent = (
	message: WireTimelineMessage,
	overrides?: Parameters<typeof buildMessageReceivedEvent>[1]
): WsMessageReceivedEvent => ({
	...buildMessageReceivedEvent(message, overrides),
	type: WsEventType.MESSAGE_RECEIVED
});

export const buildWsMessageForwardedEvent = (
	message: WireTimelineMessage,
	overrides?: Parameters<typeof buildMessageForwardedEvent>[1]
): WsMessageForwardedEvent => ({
	...buildMessageForwardedEvent(message, overrides),
	type: WsEventType.MESSAGE_FORWARDED
});

export const buildWsMessageEditedEvent = (
	overrides?: Parameters<typeof buildMessageEditedEvent>[0]
): WsMessageEditedEvent => ({
	...buildMessageEditedEvent(overrides),
	type: WsEventType.MESSAGE_EDITED
});

export const buildWsMessageDeletedEvent = (
	overrides?: Parameters<typeof buildMessageDeletedEvent>[0]
): WsMessageDeletedEvent => ({
	...buildMessageDeletedEvent(overrides),
	type: WsEventType.MESSAGE_DELETED
});

export const buildWsReactionChangedEvent = (
	overrides?: Parameters<typeof buildReactionChangedEvent>[0]
): WsReactionChangedEvent => ({
	...buildReactionChangedEvent(overrides),
	type: WsEventType.REACTION_CHANGED
});

export const buildWsMessagePinnedEvent = (
	overrides?: Parameters<typeof buildMessagePinnedEvent>[0]
): WsMessagePinnedEvent => ({
	...buildMessagePinnedEvent(overrides),
	type: WsEventType.MESSAGE_PINNED
});

export const buildWsMessageUnpinnedEvent = (
	overrides?: Parameters<typeof buildMessageUnpinnedEvent>[0]
): WsMessageUnpinnedEvent => ({
	...buildMessageUnpinnedEvent(overrides),
	type: WsEventType.MESSAGE_UNPINNED
});

export const buildWsTypingEvent = (
	overrides?: Parameters<typeof buildTypingEvent>[0]
): WsTypingEvent => ({
	...buildTypingEvent(overrides),
	type: WsEventType.TYPING
});

/** No SDK fixture: the SDK has no handler for it. The values are the TypingHandler's refusal. */
export const buildWsErrorEvent = (overrides?: Partial<WsErrorEvent>): WsErrorEvent => ({
	type: WsEventType.WS_ERROR,
	sentDate: '2026-08-01T10:00:05.123456Z',
	message: 'Not a member',
	code: 'ERR_FORBIDDEN',
	...overrides
});
