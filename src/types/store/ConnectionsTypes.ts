/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import XMPPClient from '../../network/xmpp/XMPPClient';
import IWebSocketClient from '../network/websocket/IWebSocketClient';

export type ConnectionsStoreSlice = {
	connections: Connections;
	setChatsBeStatus: (status: boolean) => void;
	setXmppStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
	resetXmppData: () => void;
};

export type Connections = {
	xmppClient: XMPPClient;
	wsClient: IWebSocketClient;
	status: {
		chats_be?: boolean;
		xmpp?: boolean;
		websocket?: boolean;
	};
};
