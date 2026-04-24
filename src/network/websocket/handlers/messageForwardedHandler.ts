/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MarkerStatus, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles message-forwarded events from the WebSocket.
 * Adds the forwarded message to the target room's store.
 */
export function handleWsMessageForwarded(event: {
	messageId: string;
	roomId: string;
	originalRoomId: string;
	senderId: string;
	text: string;
	forwardedFrom?: string;
	forwardedAt?: string;
	attachmentId?: string;
	attachmentName?: string;
	attachmentMime?: string;
	attachmentSize?: number;
}): void {
	const { newMessage, incrementUnreadCount, rooms, session } = useStore.getState();
	const { roomId, messageId, senderId, text, originalRoomId } = event;

	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleWsMessageForwarded] Room not found:', roomId);
		return;
	}

	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date: Date.now(),
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		forwardedInfo: event.forwardedFrom
			? {
					originalSenderId: event.forwardedFrom,
					originalSentAt: event.forwardedAt ?? new Date().toISOString()
			  }
			: undefined,
		attachment: event.attachmentId
			? {
					id: event.attachmentId,
					name: event.attachmentName ?? '',
					mimeType: event.attachmentMime ?? 'application/octet-stream',
					size: event.attachmentSize ?? 0
			  }
			: undefined
	};

	newMessage(textMessage);

	if (senderId !== session.id) {
		incrementUnreadCount(roomId, 1);
	}
}
