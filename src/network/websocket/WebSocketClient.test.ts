/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { WebSocketClient } from './WebSocketClient';
import useStore from '../../store/Store';
import { mockWebSocketSend } from '../../tests/mocks/global';
import { WsEventType } from '../../types/network/websocket/wsEvents';

describe('WebSocketClient', () => {
	test('Connect WebSocketClient generate a WebSocket', () => {
		const wsClient = new WebSocketClient();
		wsClient.connect();
		expect(global.WebSocket).toHaveBeenCalledWith(
			`wss://${window.location.hostname}/services/chats/events`
		);
		expect(wsClient._webSocket).toBeDefined();
		expect(wsClient._webSocket?.onopen).toBeDefined();
		expect(wsClient._webSocket?.onclose).toBeDefined();
		expect(wsClient._webSocket?.onmessage).toBeDefined();
	});

	test('Disconnect WebSocketClient close the WebSocket', () => {
		const wsClient = new WebSocketClient();
		wsClient.connect();
		wsClient.disconnect();
		expect(wsClient._webSocket).toBeUndefined();
	});

	test('Send message if WebSocket is open', () => {
		const wsClient = new WebSocketClient();
		wsClient.connect();
		wsClient.send({ type: 'ping' });
		expect(mockWebSocketSend).toHaveBeenCalled();
	});

	// test('onopen event is handled resetting reconnectionTine, setting ping and setting ws status into store', () => {
	// 	const wsClient = new WebSocketClient();
	// 	wsClient.connect();
	// 	wsClient._onOpen();
	// 	expect(wsClient._reconnectionTime).toBe(0);
	// 	expect(wsClient._pingInterval).toBeDefined();
	// 	expect(useStore.getState().connections.status.websocket).toBeTruthy();
	// });

	test('onclose event is handled setting ws status into store', () => {
		const wsClient = new WebSocketClient();
		wsClient.connect();
		wsClient._onClose();
		expect(useStore.getState().connections.status.websocket).toBeFalsy();
	});

	test('onmessage event is handled with PONG', () => {
		const wsClient = new WebSocketClient();
		const cancelDebounce = jest.spyOn(wsClient._disconnectionCheckFunction, 'cancel');
		wsClient.connect();
		const message = { type: WsEventType.PONG };
		wsClient._onMessage({ data: JSON.stringify(message) } as MessageEvent);
		expect(cancelDebounce).toHaveBeenCalled();
	});

	test('onmessage event is handled with a text message', () => {
		const wsClient = new WebSocketClient();
		wsClient.connect();
		const message = { type: WsEventType.INITIALIZATION, queueId: 'queueId' };
		wsClient._onMessage({ data: JSON.stringify(message) } as MessageEvent);
		expect(useStore.getState().session.sessionId).toBe('queueId');
	});

	// test('retryReconnection is called with exponential backoff', () => {
	// 	jest.useFakeTimers();
	// 	const wsClient = new WebSocketClient();
	// 	wsClient.connect();
	// 	expect(wsClient._reconnectionTime).toBe(0);
	//
	// 	wsClient._tryReconnection();
	// 	const firstReconnectionTime = wsClient._reconnectionTime;
	// 	expect(firstReconnectionTime).toBeGreaterThanOrEqual(0);
	// 	expect(firstReconnectionTime).toBeLessThanOrEqual(10000);
	//
	// 	wsClient._tryReconnection();
	// 	const secondReconnectionTime = wsClient._reconnectionTime;
	// 	expect(secondReconnectionTime).toBeGreaterThanOrEqual(firstReconnectionTime);
	// 	expect(secondReconnectionTime).toBeLessThanOrEqual(firstReconnectionTime * 2 + 10000);
	//
	// 	wsClient._tryReconnection();
	// 	const thirdReconnectionTime = wsClient._reconnectionTime;
	// 	expect(thirdReconnectionTime).toBeGreaterThanOrEqual(secondReconnectionTime);
	// 	expect(thirdReconnectionTime).toBeLessThanOrEqual(secondReconnectionTime * 2 + 10000);
	//
	// 	jest.useRealTimers();
	// });

	test('Reconnection timer limit is 5 minutes', () => {
		jest.useFakeTimers();
		const wsClient = new WebSocketClient();
		wsClient.connect();
		wsClient._reconnectionTime = 1000 * 60 * 2;
		wsClient._tryReconnection();
		wsClient._tryReconnection();
		wsClient._tryReconnection();

		expect(wsClient._reconnectionTime).toBeLessThanOrEqual(1000 * 60 * 5 + 10000);
		jest.useRealTimers();
	});
});
