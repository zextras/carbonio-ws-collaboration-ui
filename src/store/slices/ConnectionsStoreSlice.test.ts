/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import { WebSocketClient } from '../../network/websocket/WebSocketClient';
import XMPPClient from '../../network/xmpp/XMPPClient';
import useStore from '../Store';

describe('Connections slice', () => {
	it('XmppClient', () => {
		const { result } = renderHook(() => useStore());
		const xmpp = new XMPPClient();
		act(() => result.current.setXmppClient(xmpp));
		expect(result.current.connections.xmppClient).toBe(xmpp);

		act(() => result.current.setXmppStatus(true));
		expect(result.current.connections.status.xmpp).toBe(true);

		act(() => result.current.setXmppStatus(false));
		expect(result.current.connections.status.xmpp).toBe(false);
	});

	it('WobSocketClient', () => {
		const { result } = renderHook(() => useStore());
		const ws = new WebSocketClient();
		act(() => result.current.setWebSocketClient(ws));
		expect(result.current.connections.wsClient).toBe(ws);

		act(() => result.current.setWebsocketStatus(true));
		expect(result.current.connections.status.websocket).toBe(true);

		act(() => result.current.setWebsocketStatus(false));
		expect(result.current.connections.status.websocket).toBe(false);
	});

	it('ChatsBe', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setChatsBeStatus(true));
		expect(result.current.connections.status.chats_be).toBe(true);

		act(() => result.current.setChatsBeStatus(false));
		expect(result.current.connections.status.chats_be).toBe(false);
	});
});
