/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce, DebouncedFunc, includes } from 'lodash';
import { gte } from 'semver';

import { normalizeEventType } from './normalizedEventType';
import { wsEventsHandler } from './wsEventsHandler';
import useStore from '../../store/Store';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { WsMessage } from '../../types/network/websocket/wsMessages';
import { Version } from '../../types/store/SessionTypes';
import { wsDebug } from '../../utils/debug';

enum WsReadyState {
	CONNECTING = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3
}

export class WebSocketClient {
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
		const versions = useStore.getState().session.supportedVersions;
		// Creating WebSocket
		this._webSocket = new WebSocket(`wss://${window.location.hostname}${wsUrl}`, versions);
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
			// DEPRECATED: This function exists for backward compatibility with previous versions.
			//  * Remove once support for v1.6.1 is officially dropped.
			const ping = this._webSocket && gte(this._webSocket?.protocol, '1.6.2') ? 'Ping' : 'ping';
			this.send({ type: ping });
			this._disconnectionCheckFunction();
		}, this._pingTime);

		const { setWebsocketStatus, session, setApiVersion } = useStore.getState();
		// Set WebSocket connection status on store
		setWebsocketStatus(true);
		if (this._webSocket && this._webSocket.protocol !== session.apiVersion) {
			setApiVersion(this._webSocket.protocol as Version);
		}
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
			const rowEvent = JSON.parse(e.data);
			const event = normalizeEventType(rowEvent);
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

		// Exponential backoff with random delay between 0 and 10 seconds and max 5 minutes
		const randomDelay = Math.floor(Math.random() * (10000 + 1));
		if (this._reconnectionTime < 1000 * 60 * 2.5) {
			this._reconnectionTime = this._reconnectionTime * 2 + randomDelay;
		} else {
			this._reconnectionTime = 1000 * 60 * 5 + randomDelay;
		}
	}
}
