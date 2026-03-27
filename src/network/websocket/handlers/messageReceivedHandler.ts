/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MarkerStatus, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles incoming message-received events from the WebSocket.
 * Adds the new message to the store and increments unread count for others' messages.
 *
 * If the user is viewing a historical page (hasMoreAfter === true),
 * the message is NOT added to the chat view to prevent fragmented display.
 */
export function handleWsMessageReceived(event: {
	messageId: string;
	roomId: string;
	senderId: string;
	text: string;
	timestamp: string;
	replyToId?: string;
	attachments?: Array<{ id: string; name: string; mimeType: string; size: number }>;
}): void {
	const {
		newMessage,
		setLastMessageForInbox,
		incrementUnreadCount,
		rooms,
		session,
		chatsRegistry
	} = useStore.getState();
	const { roomId, messageId, senderId, text, timestamp } = event;

	// Check if room exists
	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleWsMessageReceived] Room not found:', roomId);
		return;
	}

	// Build TextMessage for the store
	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date: new Date(timestamp).getTime(),
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		replyTo: event.replyToId,
		attachment:
			event.attachments && event.attachments.length > 0
				? {
						id: event.attachments[0].id,
						name: event.attachments[0].name,
						mimeType: event.attachments[0].mimeType,
						size: event.attachments[0].size
					}
				: undefined
	};

	// Check if we're viewing a historical page
	const hasMoreAfter = chatsRegistry[roomId]?.hasMoreAfter ?? false;

	if (hasMoreAfter) {
		// User is viewing historical messages - update inbox only
		setLastMessageForInbox(roomId, textMessage);
		if (senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	} else {
		// User is at the latest page - add message normally
		newMessage(textMessage);
		if (senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	}
}
