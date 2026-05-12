/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMessagingBackend } from '../../network/messaging/IMessagingBackend';
import IWebSocketClient from '../network/websocket/IWebSocketClient';

export type ConnectionsStoreSlice = {
	connections: Connections;
	setChatsBeStatus: (status: boolean) => void;
	setXmppStatus: (status: boolean) => void;
	setWebsocketStatus: (status: boolean) => void;
	setIsMongooseIM: (isMongooseIM: boolean) => void;
	setMessagingBackend: (backend: IMessagingBackend) => void;
	resetXmppData: () => void;
	resetChatData: () => void;
	updateReadMarker: (roomId: string, userId: string, messageId: string) => void;
	editMessage: (roomId: string, messageId: string, text: string, editedAt: string) => void;
	deleteMessage: (roomId: string, messageId: string, deletedBy: string, deletedAt: string) => void;
};

export type Connections = {
	wsClient?: IWebSocketClient;
	status: {
		chats_be?: boolean;
		xmpp?: boolean;
		websocket?: boolean;
	};
	isMongooseIM: boolean | undefined; // undefined = detection not yet complete
	messagingBackend?: IMessagingBackend;
};
