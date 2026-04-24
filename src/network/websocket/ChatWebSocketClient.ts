/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuidv4 } from 'uuid';

import { WsAction, WsAttachment } from './types';
import { WebSocketClient } from './WebSocketClient';
import useStore from '../../store/Store';

/**
 * Higher-level client for chat messaging operations over the existing /events WebSocket.
 * Sends typed JSON actions and generates requestIds for correlation.
 *
 * This works alongside the existing WebSocketClient — it does NOT create a new connection.
 * The existing WS handles room/meeting events; this adds messaging/presence actions.
 */
class ChatWebSocketClient {
	private static instance: ChatWebSocketClient;

	/** Feature flags discovered from the server */
	features: string[] = [];

	public static getInstance(): ChatWebSocketClient {
		if (!ChatWebSocketClient.instance) {
			ChatWebSocketClient.instance = new ChatWebSocketClient();
		}
		return ChatWebSocketClient.instance;
	}

	/**
	 * Send a raw WS action JSON through the existing WebSocket connection.
	 */
	private sendAction(action: WsAction): void {
		const storeWsClient = useStore.getState().connections.wsClient as WebSocketClient | undefined;
		if (storeWsClient?._webSocket?.readyState === WebSocket.OPEN) {
			storeWsClient._webSocket.send(JSON.stringify(action));
		} else {
			console.warn('[ChatWS] sendAction dropped — socket not OPEN');
		}
	}

	/**
	 * Send a chat message to a room.
	 * Returns the requestId for correlating the message-sent response.
	 */
	sendMessage(
		roomId: string,
		text: string,
		replyToId?: string,
		attachments?: WsAttachment[]
	): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'send-message',
			requestId,
			roomId,
			text,
			replyToId,
			attachmentId: attachments?.[0]?.id
		});
		// Optimistically add the message to the store so the sender sees it immediately.
		// The message-sent ack will update the provisional id/date to the server-assigned values.
		useStore.getState().setPlaceholderMessage({
			id: requestId,
			roomId,
			text,
			replyTo: replyToId,
			attachment: attachments?.[0]
		});
		return requestId;
	}

	/**
	 * Edit an existing message.
	 */
	editMessage(roomId: string, messageId: string, text: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'edit-message',
			requestId,
			roomId,
			messageId,
			text
		});
		return requestId;
	}

	/**
	 * Delete (retract) a message.
	 */
	deleteMessage(roomId: string, messageId: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'delete-message',
			requestId,
			roomId,
			messageId
		});
		return requestId;
	}

	/**
	 * Forward a message to another room.
	 */
	forwardMessage(roomId: string, messageId: string, toRoomId: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'forward-message',
			requestId,
			roomId,
			messageId,
			toRoomId
		});
		return requestId;
	}

	/**
	 * Send a typing notification for a room.
	 * Call this (debounced, at most once per second) on every keystroke.
	 */
	sendTyping(roomId: string): void {
		this.sendAction({
			action: 'typing',
			roomId
		});
	}

	/**
	 * Mark a room as read up to a given message.
	 */
	markRead(roomId: string, messageId: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'mark-read',
			requestId,
			roomId,
			messageId
		});
		return requestId;
	}

	/**
	 * @deprecated History navigation will use REST timeline API
	 */
	requestMessageResultHistoryToId(_roomId: string, _stanzaId: string): Promise<void> {
		console.warn(
			'[ChatWebSocketClient] requestMessageResultHistoryToId not yet implemented via WS'
		);
		return Promise.resolve();
	}
}

export const chatWsClient = ChatWebSocketClient.getInstance();
