/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce, DebouncedFunc, includes } from 'lodash';

import { wsEventsHandler } from './wsEventsHandler';
import useStore from '../../store/Store';
import IWebSocketClient from '../../types/network/websocket/IWebSocketClient';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { WsMessage } from '../../types/network/websocket/wsMessages';
import { wsDebug } from '../../utils/debug';

enum WsReadyState {
	CONNECTING = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3
}

export class WebSocketClient implements IWebSocketClient {
	_webSocket: WebSocket | undefined;

	_reconnectionTime = 0;

	_pingTime = 20000;

	_pongTimeout = 5000;

	_pingInterval = 0;

	_disconnectionCheckFunction: DebouncedFunc<() => void>;

	constructor() {
		this._disconnectionCheckFunction = debounce(() => {
			clearInterval(this._pingInterval);
			this.disconnect();
			this._tryReconnection();
		}, this._pongTimeout);
	}

	connect(): void {
		const wsUrl = '/services/chats/events';
		// Creating WebSocket
		this._webSocket = new WebSocket(`wss://${window.location.hostname}${wsUrl}`);
		wsDebug('WebSocket connection...');

		// Attach handler
		this._webSocket.onopen = this._onOpen;
		this._webSocket.onclose = this._onClose;
		this._webSocket.onmessage = this._onMessage;
	}

	disconnect(): void {
		wsDebug('Disconnection.');
		this._webSocket?.close();
		this._webSocket = undefined;
	}

	send(message: WsMessage): void {
		if (this._webSocket?.readyState === WsReadyState.OPEN) {
			this._webSocket.send(JSON.stringify(message));
		}
	}

	_onOpen = (): void => {
		wsDebug('...connected!');
		this._reconnectionTime = 0;
		// Start sending ping every n seconds
		this._pingInterval = window.setInterval(() => {
			this.send({ type: 'ping' });
			this._disconnectionCheckFunction();
		}, this._pingTime);

		// Set WebSocket connection status on store
		useStore.getState().setWebsocketStatus(true);
	};

	_onClose = (): void => {
		wsDebug('WebSocket closed.');
		// Stop sending ping
		clearInterval(this._pingInterval);

		this._tryReconnection();

		// Set WebSocket connection status on store
		useStore.getState().setWebsocketStatus(false);
	};

	_onMessage = (e: MessageEvent): void => {
		if (typeof e.data === 'string') {
			const event: WsEvent = JSON.parse(e.data);
			if (event.type === WsEventType.PONG) {
				this._disconnectionCheckFunction.cancel();
			} else {
				wsEventsHandler(event);
			}
		}
	};

	_tryReconnection(): void {
		wsDebug(`Retry connection in: ${this._reconnectionTime}`);
		setTimeout(() => {
			if (!includes([WsReadyState.OPEN, WsReadyState.CONNECTING], this._webSocket?.readyState)) {
				this.connect();
			}
		}, this._reconnectionTime);
		this._reconnectionTime = this._reconnectionTime * 2 + 1000;
	}
}
