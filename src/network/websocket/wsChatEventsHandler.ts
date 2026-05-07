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
import useStore from '../../store/Store';
import {
	ConfigurationMessage,
	MarkerStatus,
	MessageType,
	OperationType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { wsDebug } from '../../utils/debug';

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
	const sessionId = useStore.getState().session.id;

	switch (chatEvent.type) {
		case 'MessageReceived':
			handleWsMessageReceived(chatEvent);
			break;

		case 'MessageEdited':
			handleWsMessageEdited(chatEvent);
			break;

		case 'MessageDeleted':
			handleWsMessageDeleted(chatEvent);
			break;

		case 'MessageForwarded':
			handleWsMessageForwarded(chatEvent);
			break;

		case 'ReactionChanged':
			handleWsReactionChanged(chatEvent);
			break;

		case 'ReadUpdated':
			// Do NOT self-skip here: handleWsReadUpdated() relies on the self-echo
			// to clear the unread count for the room. It already branches internally
			// on userId === session.id.
			handleWsReadUpdated(chatEvent);
			break;

		case 'PresenceChanged':
			handleWsPresenceChanged(chatEvent);
			break;

		case 'MessagePinned': {
			const { roomId, messageId, pinnedBy, timestamp } = chatEvent;
			const { chatsRegistry, setPinnedMessage, newMessage } = useStore.getState();
			const messages = chatsRegistry[roomId]?.messages ?? [];
			const pinned = messages.find(
				(m) =>
					m.type === MessageType.TEXT_MSG &&
					(m.id === messageId || (m as TextMessage).stanzaId === messageId)
			);
			if (pinned && pinned.type === MessageType.TEXT_MSG) {
				setPinnedMessage(roomId, pinned as TextMessage);
			} else {
				console.warn(
					'[wsChatEventsHandler] message-pinned: message not found in store for id',
					messageId
				);
			}
			const pinEvt: ConfigurationMessage = {
				id: `pin-${messageId}-${typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()}`,
				roomId,
				date: typeof timestamp === 'number' ? timestamp : Date.parse(timestamp as string),
				type: MessageType.CONFIGURATION_MSG,
				operation: OperationType.MESSAGE_PINNED,
				value: messageId,
				from: pinnedBy,
				read: MarkerStatus.READ
			};
			newMessage(pinEvt);
			break;
		}

		case 'MessageUnpinned': {
			const { roomId, messageId, unpinnedBy, timestamp } = chatEvent;
			const { removePinnedMessage, setSelectedPinnedMessage, newMessage } = useStore.getState();
			removePinnedMessage(roomId);
			setSelectedPinnedMessage(roomId, undefined);
			const unpinEvt: ConfigurationMessage = {
				id: `unpin-${messageId}-${typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()}`,
				roomId,
				date: typeof timestamp === 'number' ? timestamp : Date.parse(timestamp as string),
				type: MessageType.CONFIGURATION_MSG,
				operation: OperationType.MESSAGE_UNPINNED,
				value: messageId,
				from: unpinnedBy,
				read: MarkerStatus.READ
			};
			newMessage(unpinEvt);
			break;
		}

		case 'Typing': {
			const { roomId, userId, status } = chatEvent;
			// Don't render our own typing indicator on our own client.
			if (userId === sessionId) {
				break;
			}
			const { setIsWriting } = useStore.getState();
			const timerKey = `${roomId}:${userId}`;
			const existingTimer = typingClearTimers.get(timerKey);
			if (existingTimer) clearTimeout(existingTimer);

			if (status === 'stopped') {
				setIsWriting(roomId, userId, false);
				typingClearTimers.delete(timerKey);
			} else {
				setIsWriting(roomId, userId, true);
				// Safety net: auto-clear after 7000ms if no new started/stopped arrives
				const timer = setTimeout(() => {
					useStore.getState().setIsWriting(roomId, userId, false);
					typingClearTimers.delete(timerKey);
				}, 7000);
				typingClearTimers.set(timerKey, timer);
			}
			break;
		}

		case 'Pong':
			// Already handled by WebSocketClient._onMessage — this is a fallback
			break;

		case 'Error':
			console.error('[wsChatEventsHandler] Server error:', chatEvent.code, chatEvent.message);
			break;

		default:
			wsDebug(`Unhandled chat event type: ${eventType}`);
			return false;
	}

	return true;
}
