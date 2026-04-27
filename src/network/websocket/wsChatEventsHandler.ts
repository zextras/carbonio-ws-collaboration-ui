/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';

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

	switch (chatEvent.type) {
		case 'message-received':
			handleWsMessageReceived(chatEvent);
			break;

		case 'message-sent': {
			const { requestId, messageId, roomId, timestamp } = chatEvent;
			wsDebug(`Message sent confirmed: ${requestId} -> ${messageId}`);
			// Promote the provisional placeholder (id=requestId) to the server-assigned id.
			// We mutate in-place so React re-renders with the confirmed message.
			useStore.setState(
				produce((draft) => {
					const registry = draft.chatsRegistry[roomId];
					if (!registry) return;
					const msg = registry.messages.find(
						(m: TextMessage) => m.id === requestId
					) as TextMessage | undefined;
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.id = messageId;
						msg.stanzaId = messageId;
						msg.date = new Date(timestamp).getTime();
						msg.read = MarkerStatus.UNREAD;
					}
					// Update lastMessage so inbox reflects the confirmed message
					if (
						registry.lastMessage &&
						registry.lastMessage.type === MessageType.TEXT_MSG &&
						(registry.lastMessage.id === requestId || registry.lastMessage.stanzaId === `placeholder_${requestId}`)
					) {
						registry.lastMessage = {
							...registry.lastMessage,
							id: messageId,
							stanzaId: messageId,
							date: new Date(timestamp).getTime(),
							read: MarkerStatus.UNREAD
						};
					}
				}),
				false
			);
			break;
		}

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

		case 'message-unpinned': {
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
			wsDebug(`Unhandled chat event type: ${eventType}`);
			return false;
	}

	return true;
}
