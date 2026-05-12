/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TextMessage } from '../../types/store/ChatsRegistryTypes';

export interface ReplyInfo {
	messageId: string;
	senderId: string;
}

export interface IMessagingBackend {
	sendMessage(roomId: string, text: string, replyTo?: ReplyInfo): void;
	editMessage(roomId: string, messageId: string, text: string, editedMessageId?: string): void;
	deleteMessage(roomId: string, messageId: string, attachmentId?: string): void;
	forwardMessages(targetRoomIds: string[], messages: TextMessage[]): Promise<void>;
	toggleReaction(roomId: string, stanzaId: string, emoji: string, shouldRemove: boolean): void;
	markAsRead(roomId: string, messageId: string): void;
	pinMessage(roomId: string, messageId: string): void;
	unpinMessage(roomId: string, messageId: string): void;
	getPinnedMessage(roomId: string): Promise<TextMessage | undefined>;
	canPin(): boolean;
	sendTyping(roomId: string): void;
	sendTypingStopped(roomId: string): void;
	requestExportHistory(roomId: string, from?: number): void;
	applyFastening(
		action: 'edit' | 'delete',
		value?: string
	): {
		editedInfo?: { editedAt: string };
		deletedInfo?: { deletedBy: string; deletedAt: string };
		edited?: boolean;
		deleted?: boolean;
	};
}
