/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ChatApi from '../../apis/ChatApi';
import useStore from '../../../store/Store';
import { MessageNewEvent, ChatMessage } from '../../../types/network/models/chatTypes';
import { MessageType, TextMessage, MarkerStatus } from '../../../types/store/ChatsRegistryTypes';
import { mapChatMessageToTextMessage } from '../utilities/messageMapper';

/**
 * Handles incoming new message events from SSE.
 * Adds the new message to the store and updates unread counts.
 */
export function handleMessageNew(event: MessageNewEvent): void {
	const { newMessage, incrementUnreadCount, setUnreadCount, rooms, session, activeConversations } =
		useStore.getState();
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

	// Check if this is from someone else (not our own message)
	const isFromOther = message.senderId !== session.id;

	if (isFromOther) {
		// Check if user is viewing this room and is scrolled to the bottom
		const isViewingRoom = session.selectedRoom === roomId;
		const scrollPositionMessageId = activeConversations[roomId]?.scrollPositionMessageId;
		const isAtBottom = !scrollPositionMessageId; // undefined means at bottom

		if (isViewingRoom && isAtBottom) {
			// User is viewing the room and scrolled to bottom - auto-read
			ChatApi.setReadMarker(roomId)
				.then(() => {
					setUnreadCount(roomId, 0);
					console.log('[handleMessageNew] Auto-read marker sent for room:', roomId);
				})
				.catch((err) => {
					console.warn('[handleMessageNew] Failed to send auto-read marker:', err);
				});
		} else {
			// User is not viewing this room or not scrolled to bottom - increment unread
			incrementUnreadCount(roomId, 1);
			console.log('[handleMessageNew] Unread count incremented for room:', roomId);
		}
	}

	console.log('[handleMessageNew] New message added:', message.id);
}
