/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import {
	ChatEvent,
	MessageNewEvent,
	MessageEditedEvent,
	MessageDeletedEvent,
	ReactionAddedEvent,
	ReactionRemovedEvent,
	TypingEvent,
	PresenceChangedEvent,
	ReadMarkerUpdatedEvent
} from '../../types/network/models/chatTypes';
import {
	handleMessageNew,
	handleMessageEdited,
	handleMessageDeleted,
	handleReactionAdded,
	handleReactionRemoved,
	handleTyping,
	handlePresenceChanged,
	handleReadMarkerUpdated
} from './handlers';

/**
 * Central event handler for chat SSE events.
 * Routes events to specific handlers based on event type.
 */
export function chatSseEventsHandler(event: ChatEvent): void {
	switch (event.type) {
		case 'connection_established':
			console.log('[ChatSseEventsHandler] Connection established:', event);
			break;

		case 'message_new':
			handleMessageNew(event as MessageNewEvent);
			break;

		case 'message_edited':
			handleMessageEdited(event as MessageEditedEvent);
			break;

		case 'message_deleted':
			handleMessageDeleted(event as MessageDeletedEvent);
			break;

		case 'reaction_added':
			handleReactionAdded(event as ReactionAddedEvent);
			break;

		case 'reaction_removed':
			handleReactionRemoved(event as ReactionRemovedEvent);
			break;

		case 'typing':
			handleTyping(event as TypingEvent);
			break;

		case 'presence_changed':
			handlePresenceChanged(event as PresenceChangedEvent);
			break;

		case 'read_marker_updated':
			handleReadMarkerUpdated(event as ReadMarkerUpdatedEvent);
			break;

		case 'heartbeat':
			// Heartbeat events are used to keep the connection alive
			// No action needed on the client side
			break;

		default:
			console.warn('[ChatSseEventsHandler] Unknown event type:', event);
	}
}
