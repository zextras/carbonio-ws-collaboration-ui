/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import {
	AttachmentMessageType,
	MarkerStatus,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';

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
	attachmentId?: string;
	attachmentName?: string;
	attachmentMime?: string;
	attachmentSize?: number;
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

	// Resolve attachment: prefer the array form, fall back to flat fields
	let resolvedAttachment: AttachmentMessageType | undefined;
	if (event.attachments && event.attachments.length > 0) {
		const first = event.attachments[0];
		resolvedAttachment = {
			id: first.id,
			name: first.name,
			mimeType: first.mimeType,
			size: first.size
		};
	} else if (event.attachmentId) {
		resolvedAttachment = {
			id: event.attachmentId,
			name: event.attachmentName ?? '',
			mimeType: event.attachmentMime ?? 'application/octet-stream',
			size: event.attachmentSize ?? 0
		};
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
		attachment: resolvedAttachment
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
