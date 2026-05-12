/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMessagingBackend, ReplyInfo } from './IMessagingBackend';
import useStore from '../../store/Store';
import { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { deleteAttachment } from '../apis/AttachmentsApi';
import { xmppForwardMessages } from '../apis/RoomsApi';
import { xmppClient } from '../xmpp/XMPPClient';

export class XmppMessagingBackend implements IMessagingBackend {
	sendMessage(roomId: string, text: string, replyTo?: ReplyInfo): void {
		if (replyTo) {
			xmppClient.sendChatMessageReply(roomId, text, replyTo.senderId, replyTo.messageId);
		} else {
			xmppClient.sendChatMessage(roomId, text);
		}
	}

	editMessage(roomId: string, messageId: string, text: string, editedMessageId?: string): void {
		xmppClient.sendChatMessageEdit(roomId, text, messageId, editedMessageId ?? messageId);
	}

	deleteMessage(roomId: string, messageId: string, attachmentId?: string): void {
		if (attachmentId) {
			deleteAttachment(attachmentId).then(() =>
				xmppClient.sendChatMessageDeletion(roomId, messageId)
			);
		} else {
			xmppClient.sendChatMessageDeletion(roomId, messageId);
		}
	}

	forwardMessages(targetRoomIds: string[], messages: TextMessage[]): Promise<void> {
		return xmppForwardMessages(targetRoomIds, messages).then(() => undefined);
	}

	toggleReaction(roomId: string, stanzaId: string, emoji: string, shouldRemove: boolean): void {
		xmppClient.sendChatMessageReaction(roomId, stanzaId, shouldRemove ? '' : emoji);
	}

	markAsRead(roomId: string, messageId: string): void {
		const registry = useStore.getState().chatsRegistry[roomId];
		const unread = registry?.unread ?? 0;
		if (unread > 0) {
			useStore.getState().decrementUnreadCount(roomId, unread);
		}
		xmppClient.readMessage(roomId, messageId);
	}

	pinMessage(roomId: string, messageId: string): void {
		xmppClient.pinMessage(roomId, messageId);
	}

	unpinMessage(roomId: string, messageId: string): void {
		xmppClient.unpinMessage(roomId, messageId);
	}

	getPinnedMessage(roomId: string): Promise<TextMessage | undefined> {
		// XMPP pin retrieval fires an IQ and delivers the result via callback.
		// The caller should rely on store updates after this call.
		xmppClient.getMessagePin(roomId);
		return Promise.resolve(undefined);
	}

	canPin(): boolean {
		return xmppClient.features.includes('zextras:iq:pin');
	}

	sendTyping(roomId: string): void {
		xmppClient.sendIsWriting(roomId);
	}

	sendTypingStopped(roomId: string): void {
		xmppClient.sendPaused(roomId);
	}

	requestExportHistory(roomId: string, from?: number): void {
		xmppClient.requestFullHistory(roomId, from);
	}

	applyFastening(
		action: 'edit' | 'delete',
		_value?: string
	): {
		editedInfo?: { editedAt: string };
		deletedInfo?: { deletedBy: string; deletedAt: string };
		edited?: boolean;
		deleted?: boolean;
	} {
		if (action === 'edit') {
			return { edited: true };
		}
		return { deleted: true };
	}
}
