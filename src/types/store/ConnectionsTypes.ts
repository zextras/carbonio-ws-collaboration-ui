/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import IWebSocketClient from '../network/websocket/IWebSocketClient';
import IXMPPClient from '../network/xmpp/IXMPPClient';

export type Connections = {
	xmppClient: IXMPPClient;
	wsClient: IWebSocketClient;
	status: {
		chats_be?: boolean;
		xmpp?: boolean;
		websocket?: boolean;
	};
};
