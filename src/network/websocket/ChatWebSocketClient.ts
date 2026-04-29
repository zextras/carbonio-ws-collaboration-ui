/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WsAction } from './types';
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
