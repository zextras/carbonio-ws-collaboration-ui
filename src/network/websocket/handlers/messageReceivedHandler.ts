/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';

import useStore from '../../../store/Store';
import type { Attachment } from '../../../types/network/models/attachmentTypes';
import {
	AttachmentMessageType,
	MarkerStatus,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import type { WsTimelineMessage } from '../types';

const toGalleryAttachment = (
	resolved: AttachmentMessageType | undefined,
	senderId: string,
	roomId: string,
	messageId: string,
	createdAt: string
): Attachment | undefined => {
	if (!resolved) return undefined;
	return {
		id: resolved.id,
		name: resolved.name,
		mimeType: resolved.mimeType,
		size: Number(resolved.size) || 0,
		userId: senderId,
		roomId,
		createdAt: new Date(createdAt).toISOString(),
		messageId
	};
};

const resolveAttachment = (
	att: WsTimelineMessage['attachment']
): AttachmentMessageType | undefined => {
	if (!att) return undefined;
	return {
		id: att.id,
		name: att.name,
		mimeType: att.mimeType,
		size: att.size,
		area: att.area
	};
};

const resolveRepliedMessage = (
	rm: WsTimelineMessage | undefined,
	replyToId: string | undefined,
	roomId: string
): TextMessage | undefined => {
	if (rm) {
		return {
			id: rm.id,
			stanzaId: rm.id,
			roomId: rm.roomId,
			type: MessageType.TEXT_MSG,
			date: new Date(rm.createdAt).getTime(),
			from: rm.senderId,
			text: rm.deletedInfo ? '' : rm.text,
			read: MarkerStatus.READ,
			deleted: rm.deletedInfo ? true : undefined,
			deletedInfo: rm.deletedInfo,
			attachment: resolveAttachment(rm.attachment)
		} as TextMessage;
	}
	if (replyToId) {
		return {
			id: replyToId,
			stanzaId: replyToId,
			roomId,
			from: '',
			text: '',
			type: MessageType.TEXT_MSG,
			date: 0,
			read: MarkerStatus.READ
		} as TextMessage;
	}
	return undefined;
};

export function handleWsMessageReceived(event: {
	type: 'MessageReceived';
	message: WsTimelineMessage;
	tempId?: string;
}): void {
	const {
		newMessage,
		setLastMessageForInbox,
		incrementUnreadCount,
		rooms,
		session,
		chatsRegistry
	} = useStore.getState();

	const { id: messageId, roomId, senderId, text, createdAt, replyToId } = event.message;

	const room = rooms[roomId];
	if (!room) {
		console.warn('[handleWsMessageReceived] Room not found:', roomId);
		return;
	}

	const resolvedAttachment = resolveAttachment(event.message.attachment);
	const repliedMessage = resolveRepliedMessage(event.message.repliedMessage, replyToId, roomId);
	const confirmedDate = new Date(createdAt).getTime();

	if (senderId === session.id) {
		const messages = chatsRegistry[roomId]?.messages ?? [];

		if (messages.some((m) => m.id === messageId)) {
			return;
		}

		const placeholder = event.tempId
			? messages.find(
					(m) => m.type === MessageType.TEXT_MSG && (m as TextMessage).tempId === event.tempId
				)
			: undefined;

		if (placeholder) {
			const pid = placeholder.id;
			useStore.setState(
				produce((draft) => {
					const registry = draft.chatsRegistry[roomId];
					if (!registry) return;
					const msg = registry.messages.find((m: TextMessage) => m.id === pid);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.id = messageId;
						msg.stanzaId = messageId;
						msg.date = confirmedDate;
						msg.text = text;
						msg.read = MarkerStatus.UNREAD;
						if (resolvedAttachment) {
							msg.attachment = resolvedAttachment;
						}
						msg.repliedMessage = repliedMessage;
						msg.replyTo = replyToId;
						msg.tempId = undefined;
					}
					if (
						registry.lastMessage &&
						(registry.lastMessage.id === pid ||
							(registry.lastMessage as TextMessage).stanzaId === `placeholder_${pid}`)
					) {
						registry.lastMessage = {
							...registry.lastMessage,
							id: messageId,
							stanzaId: messageId,
							date: confirmedDate,
							read: MarkerStatus.UNREAD,
							tempId: undefined
						} as TextMessage;
					}
				}),
				false
			);
			const galleryAttachmentSelf = toGalleryAttachment(
				resolvedAttachment,
				senderId,
				roomId,
				messageId,
				createdAt
			);
			if (galleryAttachmentSelf) {
				useStore.getState().prependMediaGalleryAttachment(roomId, galleryAttachmentSelf);
			}
		}
		return;
	}

	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date: confirmedDate,
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		replyTo: replyToId,
		repliedMessage,
		attachment: resolvedAttachment,
		forwardedInfo: event.message.forwardedInfo
			? {
					originalSenderId: event.message.forwardedInfo.originalSenderId,
					originalSentAt: event.message.forwardedInfo.originalSentAt
				}
			: undefined
	};

	const hasMoreAfter = chatsRegistry[roomId]?.hasMoreAfter ?? false;

	if (hasMoreAfter) {
		setLastMessageForInbox(roomId, textMessage);
	} else {
		newMessage(textMessage);
	}
	incrementUnreadCount(roomId, 1);

	const galleryAttachment = toGalleryAttachment(
		resolvedAttachment,
		senderId,
		roomId,
		messageId,
		createdAt
	);
	if (galleryAttachment) {
		useStore.getState().prependMediaGalleryAttachment(roomId, galleryAttachment);
	}
}
