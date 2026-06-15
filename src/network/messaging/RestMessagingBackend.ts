/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { downloadChatExport } from './chatExportDownload';
import { IMessagingBackend, ReplyInfo } from './IMessagingBackend';
import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MarkerStatus, MessageType, TextMessage } from '../../types/store/ChatsRegistryTypes';
import { deleteAttachment } from '../apis/AttachmentsApi';
import ChatApi from '../apis/ChatApi';
import { chatWsClient } from '../websocket/ChatWebSocketClient';

export class RestMessagingBackend implements IMessagingBackend {
	sendMessage(roomId: string, text: string, replyTo?: ReplyInfo): void {
		ChatApi.sendMessage(roomId, text, replyTo?.messageId).catch((err) => {
			console.error('[RestMessagingBackend] sendMessage failed', err);
		});
	}

	editMessage(roomId: string, messageId: string, text: string): void {
		ChatApi.editMessage(roomId, messageId, text).catch((err) => {
			console.error('[RestMessagingBackend] editMessage failed', err);
		});
	}

	deleteMessage(roomId: string, messageId: string, attachmentId?: string): void {
		const doDelete = (): void => {
			ChatApi.deleteMessage(roomId, messageId).catch((err) => {
				console.error('[RestMessagingBackend] deleteMessage failed', err);
			});
		};
		if (attachmentId) {
			deleteAttachment(attachmentId).then(doDelete).catch(doDelete);
		} else {
			doDelete();
		}
	}

	forwardMessages(targetRoomIds: string[], messages: TextMessage[]): Promise<void> {
		const mapped = messages.map((m) => ({
			sourceRoomId: m.roomId,
			messageId: m.stanzaId
		}));
		const promises = targetRoomIds.map((toRoomId) => ChatApi.forwardMessages(toRoomId, mapped));
		return Promise.allSettled(promises).then(() => undefined);
	}

	toggleReaction(roomId: string, stanzaId: string, emoji: string, shouldRemove: boolean): void {
		if (shouldRemove) {
			ChatApi.removeReaction(roomId, stanzaId, emoji);
		} else {
			ChatApi.addReaction(roomId, stanzaId, emoji);
		}
	}

	markAsRead(roomId: string, messageId: string): void {
		ChatApi.setReadMarker(roomId, messageId).catch((err: unknown) => {
			console.error('[RestMessagingBackend] setReadMarker failed:', err);
		});
	}

	pinMessage(roomId: string, messageId: string): void {
		ChatApi.pinMessage(roomId, messageId).catch((err) => {
			console.error('[RestMessagingBackend] pinMessage failed:', err);
		});
	}

	unpinMessage(roomId: string, messageId: string): void {
		ChatApi.unpinMessage(roomId, messageId).catch((err) => {
			console.error('[RestMessagingBackend] unpinMessage failed:', err);
		});
	}

	getPinnedMessage(roomId: string): Promise<TextMessage | undefined> {
		return ChatApi.getPinnedMessage(roomId).then((pins) => {
			if (!pins || pins.length === 0) {
				return undefined;
			}
			const sorted = [...pins].sort((a, b) => Date.parse(b.pinnedAt) - Date.parse(a.pinnedAt));
			const pin = sorted[0];
			return {
				id: pin.messageId,
				stanzaId: pin.messageId,
				roomId: pin.roomId,
				from: pin.senderId,
				text: pin.text,
				date: Date.parse(pin.pinnedAt),
				type: MessageType.TEXT_MSG,
				read: MarkerStatus.READ
			} as TextMessage;
		});
	}

	canPin(): boolean {
		// REST backend always supports pinning when the API is available
		return true;
	}

	sendTyping(roomId: string): void {
		chatWsClient.sendTyping(roomId);
	}

	sendTypingStopped(roomId: string): void {
		chatWsClient.sendTypingStopped(roomId);
	}

	requestExportHistory(roomId: string, _from?: number): void {
		// WSC export is a server-streamed download. Single source of truth in chatExportDownload.
		const chatName = getRoomNameSelector(useStore.getState(), roomId);
		downloadChatExport(roomId, chatName);
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
			return { editedInfo: { editedAt: new Date().toISOString() } };
		}
		return { deletedInfo: { deletedBy: '', deletedAt: new Date().toISOString() } };
	}
}
