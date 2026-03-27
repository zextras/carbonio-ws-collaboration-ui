/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	handleWsMessageReceived,
	handleWsMessageEdited,
	handleWsMessageDeleted,
	handleWsMessageForwarded,
	handleWsReactionChanged,
	handleWsReadUpdated,
	handleWsPresenceChanged
} from './handlers';
import { WsChatEvent, isChatEvent } from './types';
import { wsDebug } from '../../utils/debug';

/**
 * Routes incoming chat WebSocket events to the appropriate handler.
 * This handles the new unified JSON protocol events (messaging, presence, reactions, read markers).
 *
 * Returns true if the event was handled, false if it should be passed to the legacy handler.
 */
export function wsChatEventsHandler(event: Record<string, unknown>): boolean {
	const eventType = event.type as string;

	if (!isChatEvent(eventType)) {
		return false;
	}

	const chatEvent = event as unknown as WsChatEvent;

	switch (chatEvent.type) {
		case 'message-received':
			handleWsMessageReceived(chatEvent);
			break;

		case 'message-sent':
			// message-sent is the acknowledgment to the sender; the message was already
			// added to the store as a placeholder when sent. We can use this to confirm it.
			wsDebug('Message sent confirmed:', chatEvent.requestId);
			break;

		case 'message-edited':
			handleWsMessageEdited(chatEvent);
			break;

		case 'message-deleted':
			handleWsMessageDeleted(chatEvent);
			break;

		case 'message-forwarded':
			handleWsMessageForwarded(chatEvent);
			break;

		case 'reaction-changed':
			handleWsReactionChanged(chatEvent);
			break;

		case 'read-updated':
			handleWsReadUpdated(chatEvent);
			break;

		case 'presence-changed':
			handleWsPresenceChanged(chatEvent);
			break;

		case 'pong':
			// Already handled by WebSocketClient._onMessage — this is a fallback
			break;

		case 'error':
			console.error('[wsChatEventsHandler] Server error:', chatEvent.code, chatEvent.message);
			break;

		default:
			wsDebug('Unhandled chat event type', eventType);
			return false;
	}

	return true;
}
