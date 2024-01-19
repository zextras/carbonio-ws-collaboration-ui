/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import { WebSocketClient } from '../../network/websocket/WebSocketClient';
import XMPPClient from '../../network/xmpp/XMPPClient';
import {
	createMockMarker,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../tests/createMock';
import useStore from '../Store';

describe('Connections slice', () => {
	test('XmppClient', () => {
		const { result } = renderHook(() => useStore());
		const xmpp = new XMPPClient();
		act(() => result.current.setXmppClient(xmpp));
		expect(result.current.connections.xmppClient).toBe(xmpp);

		act(() => result.current.setXmppStatus(true));
		expect(result.current.connections.status.xmpp).toBe(true);

		act(() => result.current.setXmppStatus(false));
		expect(result.current.connections.status.xmpp).toBe(false);
	});

	test('WobSocketClient', () => {
		const { result } = renderHook(() => useStore());
		const ws = new WebSocketClient();
		act(() => result.current.setWebSocketClient(ws));
		expect(result.current.connections.wsClient).toBe(ws);

		act(() => result.current.setWebsocketStatus(true));
		expect(result.current.connections.status.websocket).toBe(true);

		act(() => result.current.setWebsocketStatus(false));
		expect(result.current.connections.status.websocket).toBe(false);
	});

	test('ChatsBe', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setChatsBeStatus(true));
		expect(result.current.connections.status.chats_be).toBe(true);

		act(() => result.current.setChatsBeStatus(false));
		expect(result.current.connections.status.chats_be).toBe(false);
	});

	test('Reset XMPP data', () => {
		const user = createMockUser({ id: '1', online: true });
		const room1 = createMockRoom({ id: '1' });
		const room2 = createMockRoom({ id: '2' });
		const message1 = createMockTextMessage({ id: '1', roomId: room1.id });
		const message2 = createMockTextMessage({ id: '2', roomId: room2.id });
		const marker1 = createMockMarker({ messageId: message1.id });
		const marker2 = createMockMarker({ messageId: message2.id });

		const { result } = renderHook(() => useStore());

		// API effects to store
		act(() => {
			result.current.setLoginInfo('userId', 'User');
			result.current.setUserInfo(user);
			result.current.setRooms([room1, room2]);
		});

		const initialStore = useStore.getState();

		// XMPP effects to store
		act(() => {
			result.current.setLoginInfo('userId', 'User');
			result.current.setUserInfo(user);
			result.current.newInboxMessage(message1);
			result.current.updateHistory(room1.id, [message1]);
			result.current.updateHistory(room2.id, [message2]);
			result.current.updateMarkers(room1.id, [marker1]);
			result.current.updateMarkers(room2.id, [marker2]);
		});

		act(() => result.current.resetXmppData());

		expect(result.current.session).toEqual(initialStore.session);
		expect(result.current.rooms).toEqual(initialStore.rooms);
		expect(result.current.users[user.id].online).toBeUndefined();
		expect(result.current.rooms).toEqual(initialStore.rooms);
		expect(result.current.messages).toEqual(initialStore.messages);
		expect(result.current.markers).toEqual(initialStore.markers);
		expect(result.current.unreads).toEqual(initialStore.unreads);
		expect(result.current.fastenings).toEqual(initialStore.fastenings);
	});
});
