/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';

import { pendingMessageIds } from '../../apis/ChatApi';
import useStore from '../../../store/Store';
import {
	AttachmentMessageType,
	MarkerStatus,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';

/**
 * Handles incoming message-received events from the WebSocket.
 *
 * For OTHER users' messages: adds the message to the store and increments unread.
 * For MY OWN messages: promotes the PENDING placeholder to a confirmed message.
 * This is the single source of truth for delivery confirmation — REST is fire-and-forget.
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
	forwardedFrom?: string;
	forwardedAt?: string;
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

	// Resolve repliedMessage
	const existingReplyTarget = event.replyToId
		? (chatsRegistry[roomId]?.messages ?? []).find(
				(m) =>
					m.type === MessageType.TEXT_MSG &&
					(m.id === event.replyToId || (m as TextMessage).stanzaId === event.replyToId)
			)
		: undefined;

	const repliedMessage: TextMessage | undefined = existingReplyTarget
		? (existingReplyTarget as TextMessage)
		: event.replyToId
			? ({
					id: event.replyToId,
					stanzaId: event.replyToId,
					roomId,
					from: '',
					text: '',
					type: MessageType.TEXT_MSG,
					date: 0,
					read: MarkerStatus.READ
				} as TextMessage)
			: undefined;

	const confirmedDate = new Date(timestamp).getTime();

	// ─── Self-echo: promote pending placeholder to confirmed message ───
	// sendMessage is the only REST call that renders before server confirmation
	// (PENDING placeholder). This WS echo is the delivery confirmation that
	// switches the placeholder to a real message with a checkmark.
	if (senderId === session.id) {
		const messages = chatsRegistry[roomId]?.messages ?? [];

		// Already in store (e.g. attachment upload inserted from REST response) — skip
		if (messages.some((m) => m.id === messageId)) {
			return;
		}

		// Try ID-based match first (REST response stored serverId → stableId mapping)
		let placeholderId = pendingMessageIds.get(messageId);
		pendingMessageIds.delete(messageId);

		// Fallback: WS arrived before REST response — find oldest PENDING placeholder
		if (!placeholderId) {
			const placeholder = messages.find(
				(m) => m.type === MessageType.TEXT_MSG && (m as TextMessage).read === MarkerStatus.PENDING
			);
			placeholderId = placeholder?.id;
		}

		if (placeholderId) {
			const pid = placeholderId;
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
						msg.attachment = resolvedAttachment;
						msg.repliedMessage = repliedMessage;
						msg.replyTo = event.replyToId;
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
							read: MarkerStatus.UNREAD
						} as TextMessage;
					}
				}),
				false
			);
		}
		return;
	}

	// ─── Other user's message ───
	const textMessage: TextMessage = {
		id: messageId,
		stanzaId: messageId,
		roomId,
		type: MessageType.TEXT_MSG,
		date: confirmedDate,
		from: senderId,
		text,
		read: MarkerStatus.UNREAD,
		replyTo: event.replyToId,
		repliedMessage,
		attachment: resolvedAttachment,
		forwardedInfo: event.forwardedFrom
			? {
					originalSenderId: event.forwardedFrom,
					originalSentAt: event.forwardedAt ?? new Date().toISOString()
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
}
