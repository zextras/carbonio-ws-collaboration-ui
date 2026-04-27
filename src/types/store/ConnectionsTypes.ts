/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import IWebSocketClient from '../network/websocket/IWebSocketClient';

export type ConnectionsStoreSlice = {
	connections: Connections;
	setChatsBeStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
	resetChatData: () => void;
	updateReadMarker: (roomId: string, userId: string, messageId: string) => void;
	editMessage: (roomId: string, messageId: string, text: string, editedAt: string) => void;
	deleteMessage: (roomId: string, messageId: string, deletedBy: string, deletedAt: string) => void;
};

export type Connections = {
	wsClient?: IWebSocketClient;
	status: {
		chats_be?: boolean;
		websocket?: boolean;
	};
};
