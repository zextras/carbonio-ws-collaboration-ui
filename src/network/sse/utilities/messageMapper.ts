/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChatMessage, ReactionGroup } from '../../../types/network/models/chatTypes';
import {
	TextMessage,
	MessageType,
	MarkerStatus,
	MessageFastening
} from '../../../types/store/ChatsRegistryTypes';

/**
 * Maps a ChatMessage from the REST API to a TextMessage for the store.
 */
export function mapChatMessageToTextMessage(
	chatMessage: ChatMessage,
	currentUserId: string
): TextMessage {
	// Determine read status - own messages are always read
	const isOwnMessage = chatMessage.senderId === currentUserId;
	const readStatus = isOwnMessage ? MarkerStatus.READ : MarkerStatus.UNREAD;

	return {
		id: chatMessage.id,
		stanzaId: chatMessage.id,
		roomId: chatMessage.roomId,
		type: MessageType.TEXT_MSG,
		date: new Date(chatMessage.createdAt).getTime(),
		from: chatMessage.senderId,
		text: chatMessage.text,
		read: readStatus,
		edited: chatMessage.edited,
		deleted: chatMessage.deleted,
		replyTo: chatMessage.replyToId,
		repliedMessage: chatMessage.replyTo
			? {
					id: chatMessage.replyTo.id,
					stanzaId: chatMessage.replyTo.id,
					roomId: chatMessage.roomId,
					type: MessageType.TEXT_MSG,
					date: 0, // We don't have the original date
					from: chatMessage.replyTo.senderId,
					text: chatMessage.replyTo.text || '',
					read: MarkerStatus.READ,
					deleted: chatMessage.replyTo.deleted
				}
			: undefined,
		attachment: chatMessage.attachment
			? {
					id: chatMessage.attachment.id,
					name: chatMessage.attachment.name,
					mimeType: chatMessage.attachment.mimeType,
					size: chatMessage.attachment.size
				}
			: undefined
	};
}

/**
 * Maps reaction groups from the REST API to fastening messages for the store.
 */
export function mapReactionsToFastenings(
	messageId: string,
	roomId: string,
	reactions: ReactionGroup[]
): MessageFastening[] {
	const fastenings: MessageFastening[] = [];

	reactions.forEach((group) => {
		group.userIds.forEach((userId) => {
			fastenings.push({
				id: `${messageId}-${userId}-${group.reaction}`,
				roomId,
				type: MessageType.FASTENING,
				date: Date.now(),
				originalStanzaId: messageId,
				action: 'apply',
				value: group.reaction,
				from: userId
			});
		});
	});

	return fastenings;
}
