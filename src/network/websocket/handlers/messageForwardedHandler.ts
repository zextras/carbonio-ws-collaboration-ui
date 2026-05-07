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
 *
 * If the user is viewing a historical page (hasMoreAfter === true),
 * the message is NOT added to the chat view to prevent fragmented display.
 * Instead, only the inbox sidebar is updated.
 */
export function handleWsMessageForwarded(event: {
	messageId: string;
	roomId: string;
	originalRoomId: string;
	senderId: string;
	text: string;
	timestamp?: string;
	forwardedFrom?: string;
	forwardedAt?: string;
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
	const { roomId, messageId, senderId, text } = event;

	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleWsMessageForwarded] Room not found:', roomId);
		return;
	}

	// Use server timestamp when available, fall back to Date.now()
	const date = event.timestamp ? new Date(event.timestamp).getTime() : Date.now();

	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date,
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		forwarded: event.forwardedFrom
			? {
					from: event.forwardedFrom,
					date: event.forwardedAt ? new Date(event.forwardedAt).getTime() : Date.now(),
					id: messageId,
					count: 1
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

	// Check if we're viewing a historical page
	const hasMoreAfter = chatsRegistry[roomId]?.hasMoreAfter ?? false;

	if (hasMoreAfter) {
		// User is viewing historical messages - update inbox sidebar only
		setLastMessageForInbox(roomId, textMessage);
		if (senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	} else {
		// User is at the latest page - add message to timeline normally
		newMessage(textMessage);
		if (senderId !== session.id) {
			incrementUnreadCount(roomId, 1);
		}
	}
}
