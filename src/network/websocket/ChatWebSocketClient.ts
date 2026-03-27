/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuidv4 } from 'uuid';

import { WsAction, WsAttachment } from './types';
import { wsClient } from './WebSocketClient';

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
		if (wsClient._webSocket?.readyState === WebSocket.OPEN) {
			wsClient._webSocket.send(JSON.stringify(action));
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
			attachments
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
	 * Add a reaction to a message.
	 */
	addReaction(roomId: string, messageId: string, reaction: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'add-reaction',
			requestId,
			roomId,
			messageId,
			reaction
		});
		return requestId;
	}

	/**
	 * Remove a reaction from a message.
	 */
	removeReaction(roomId: string, messageId: string, reaction: string): string {
		const requestId = uuidv4();
		this.sendAction({
			action: 'remove-reaction',
			requestId,
			roomId,
			messageId,
			reaction
		});
		return requestId;
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

	// ==================== Pin message stubs ====================
	// These are XMPP-era features that will be migrated to REST.
	// For now, provide no-op stubs so existing code compiles.

	/**
	 * @deprecated Pin message will be migrated to REST API
	 */
	pinMessage(_roomId: string, _stanzaId: string): void {
		console.warn('[ChatWebSocketClient] pinMessage not yet implemented via WS');
	}

	/**
	 * @deprecated Unpin message will be migrated to REST API
	 */
	unpinMessage(_roomId: string, _stanzaId: string): void {
		console.warn('[ChatWebSocketClient] unpinMessage not yet implemented via WS');
	}

	/**
	 * @deprecated Get message pin will be migrated to REST API
	 */
	getMessagePin(_roomId: string): void {
		console.warn('[ChatWebSocketClient] getMessagePin not yet implemented via WS');
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
