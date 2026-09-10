/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MarkerStatus, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import type { WsTimelineMessage } from '../types';

export function handleWsMessageForwarded(event: {
	type: 'MessageForwarded';
	message: WsTimelineMessage;
}): void {
	const {
		newMessage,
		setLastMessageForInbox,
		incrementUnreadCount,
		rooms,
		session,
		chatsRegistry
	} = useStore.getState();

	const { id: messageId, roomId, senderId, text, createdAt } = event.message;

	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleWsMessageForwarded] Room not found:', roomId);
		return;
	}

	const date = new Date(createdAt).getTime();

	const att = event.message.attachment;
	const resolvedAttachment = att
		? { id: att.id, name: att.name, mimeType: att.mimeType, size: att.size, area: att.area }
		: undefined;

	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date,
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		forwardedInfo: event.message.forwardedInfo
			? {
					originalSenderId: event.message.forwardedInfo.originalSenderId,
					originalSentAt: event.message.forwardedInfo.originalSentAt
				}
			: undefined,
		attachment: resolvedAttachment
	};

	const hasMoreAfter = chatsRegistry[roomId]?.hasMoreAfter ?? false;

	if (hasMoreAfter) {
		setLastMessageForInbox(roomId, textMessage);
	} else {
		newMessage(textMessage);
	}
	if (senderId !== session.id) {
		incrementUnreadCount(roomId, 1);
	}
}
