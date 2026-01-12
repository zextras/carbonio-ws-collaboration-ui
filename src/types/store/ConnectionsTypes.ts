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
	setChatSseStatus: (status: boolean) => void;
	setChatConnectionId: (connectionId: string) => void;
	resetChatData: () => void;
	setUserPresence: (userId: string, online: boolean, lastActivityAt?: string) => void;
	updateReadMarker: (roomId: string, userId: string, messageId: string) => void;
	editMessage: (roomId: string, messageId: string, text: string, edited: boolean) => void;
	deleteMessage: (roomId: string, messageId: string) => void;
};

export type Connections = {
	wsClient: IWebSocketClient;
	chatConnectionId?: string;
	status: {
		chats_be?: boolean;
		websocket?: boolean;
		chat_sse?: boolean;
	};
};
