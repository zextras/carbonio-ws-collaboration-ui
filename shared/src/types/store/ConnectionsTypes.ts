/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionsStoreSlice = {
	connections: Connections;
	setChatsBeStatus: (status: boolean) => void;
	setXmppStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
	setMessageBrokerStatus: (status: boolean) => void;
	resetXmppData: () => void;
};

export type Connections = {
	status: {
		chats_be?: boolean;
		xmpp?: boolean;
		websocket?: boolean;
		messageBroker?: boolean;
	};
};
