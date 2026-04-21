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
import useStore from '../../store/Store';
import { MessageType, TextMessage } from '../../types/store/ChatsRegistryTypes';

/** Tracks per-room per-user auto-clear timers for typing state */
const typingClearTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

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

		case 'message-pinned': {
			const { roomId, messageId } = chatEvent;
			const { chatsRegistry, setPinnedMessage } = useStore.getState();
			const messages = chatsRegistry[roomId]?.messages ?? [];
			const pinned = messages.find(
				(m) =>
					m.type === MessageType.TEXT_MSG &&
					(m.id === messageId || (m as TextMessage).stanzaId === messageId)
			);
			if (pinned && pinned.type === MessageType.TEXT_MSG) {
				setPinnedMessage(roomId, pinned as TextMessage);
			} else {
				console.warn('[wsChatEventsHandler] message-pinned: message not found in store for id', messageId);
			}
			break;
		}

		case 'message-unpinned': {
			const { roomId } = chatEvent;
			useStore.getState().removePinnedMessage(roomId);
			useStore.getState().setSelectedPinnedMessage(roomId, undefined);
			break;
		}

		case 'typing': {
			const { roomId, userId } = chatEvent;
			const { setIsWriting } = useStore.getState();
			// Set user as writing
			setIsWriting(roomId, userId, true);
			// Cancel any existing auto-clear timer for this user+room
			const timerKey = `${roomId}:${userId}`;
			const existing = typingClearTimers.get(timerKey);
			if (existing) clearTimeout(existing);
			// Auto-clear after 3 seconds
			const timer = setTimeout(() => {
				useStore.getState().setIsWriting(roomId, userId, false);
				typingClearTimers.delete(timerKey);
			}, 3000);
			typingClearTimers.set(timerKey, timer);
			break;
		}

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
