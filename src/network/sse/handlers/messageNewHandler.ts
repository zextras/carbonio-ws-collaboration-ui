/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageNewEvent } from '../../../types/network/models/chatTypes';
import { mapChatMessageToTextMessage } from '../utilities/messageMapper';

/**
 * Handles incoming new message events from SSE.
 * Adds the new message to the store and increments unread count for others' messages.
 * The MessagesList component handles auto-read when user is at bottom.
 *
 * IMPORTANT: If the user is viewing a historical page (hasMoreAfter === true),
 * the message is NOT added to the chat view to prevent fragmentated display.
 * The message will appear when the user scrolls down to load newer messages
 * or clicks "Return to latest".
 */
export function handleMessageNew(event: MessageNewEvent): void {
	const { newMessage, incrementUnreadCount, rooms, session, chatsRegistry } = useStore.getState();
	const { roomId, message } = event;

	// Check if room exists
	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleMessageNew] Room not found:', roomId);
		return;
	}

	// Convert ChatMessage to TextMessage format used by the store
	const textMessage = mapChatMessageToTextMessage(message, session.id || '');

	// Check if we're viewing a historical page (not at the latest messages)
	const hasMoreAfter = chatsRegistry[roomId]?.hasMoreAfter ?? false;

	if (hasMoreAfter) {
		// User is viewing historical messages - don't add to chat to prevent fragmentation
		// The message will appear when they scroll to the end or click "Return to latest"
		// Only increment unread count for messages from others
		if (message.senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	} else {
		// User is at the latest page - add message normally
		newMessage(textMessage);

		// Increment unread count for messages from others
		// Auto-read is handled by MessagesList when user is viewing and at bottom
		if (message.senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	}
}
