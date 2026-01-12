/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageNewEvent, ChatMessage } from '../../../types/network/models/chatTypes';
import { MessageType, TextMessage, MarkerStatus } from '../../../types/store/ChatsRegistryTypes';
import { mapChatMessageToTextMessage } from '../utilities/messageMapper';

/**
 * Handles incoming new message events from SSE.
 * Adds the new message to the store and updates unread counts.
 */
export function handleMessageNew(event: MessageNewEvent): void {
	const { newMessage, rooms, session } = useStore.getState();
	const { roomId, message } = event;

	// Check if room exists
	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleMessageNew] Room not found:', roomId);
		return;
	}

	// Convert ChatMessage to TextMessage format used by the store
	const textMessage = mapChatMessageToTextMessage(message, session.id || '');

	// Add message to store
	newMessage(textMessage);

	console.log('[handleMessageNew] New message added:', message.id);
}
