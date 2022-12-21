/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import IWebSocketClient from '../../types/network/websocket/IWebSocketClient';
import IXMPPClient from '../../types/network/xmpp/IXMPPClient';
import { ConnectionsStoreSlice, RootStore } from '../../types/store/StoreTypes';

export const useConnectionsStoreSlice = (set: (...any: any) => void): ConnectionsStoreSlice => ({
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	connections: {
		status: {}
	},
	setXmppClient: (xmppClient: IXMPPClient): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.xmppClient = xmppClient;
			}),
			false,
			'CONNECTIONS/SET_XMPP_CLIENT'
		);
	},
	setWebSocketClient: (wsClient: IWebSocketClient): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.wsClient = wsClient;
			}),
			false,
			'CONNECTIONS/SET_WS_CLIENT'
		);
	},
	setChatsBeStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.chats_be = status;
			}),
			false,
			'CONNECTIONS/SET_CHATS_BE_STATUS'
		);
	},
	setXmppStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.xmpp = status;
			}),
			false,
			'CONNECTIONS/SET_XMPP_STATUS'
		);
	},
	setWebsocketStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.websocket = status;
			}),
			false,
			'CONNECTIONS/SET_WEBSOCKET_STATUS'
		);
	}
});
