/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { forEach } from 'lodash';
import { StateCreator } from 'zustand';

import { WebSocketClient } from '../../network/websocket/WebSocketClient';
import { ConnectionsStoreSlice } from '../../types/store/ConnectionsTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { MarkerStatus, MessageType } from '../../types/store/ChatsRegistryTypes';

export const useConnectionsStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ConnectionsStoreSlice
> = (set) => ({
	connections: {
		wsClient: new WebSocketClient(),
		status: {}
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
	setWebsocketStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.websocket = status;
			}),
			false,
			'CONNECTIONS/SET_WEBSOCKET_STATUS'
		);
	},
	setChatSseStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.chat_sse = status;
			}),
			false,
			'CONNECTIONS/SET_CHAT_SSE_STATUS'
		);
	},
	setChatConnectionId: (connectionId: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.chatConnectionId = connectionId;
			}),
			false,
			'CONNECTIONS/SET_CHAT_CONNECTION_ID'
		);
	},
	resetChatData: (): void => {
		set(
			produce((draft: RootStore) => {
				forEach(draft.users, (user) => {
					draft.users[user.id] = {
						...draft.users[user.id],
						online: undefined,
						lastActivity: undefined
					};
				});
				draft.chatsRegistry = {};
				draft.activeConversations = {};
			}),
			false,
			'CONNECTIONS/RESET_CHAT_DATA'
		);
	},
	setUserPresence: (userId: string, online: boolean, lastActivityAt?: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.users[userId]) {
					draft.users[userId].online = online;
					if (lastActivityAt) {
						draft.users[userId].lastActivity = new Date(lastActivityAt).getTime();
					}
				}
			}),
			false,
			'CONNECTIONS/SET_USER_PRESENCE'
		);
	},
	updateReadMarker: (roomId: string, userId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					// Update the marker in the markers map
					if (!registry.markers) {
						registry.markers = {};
					}
					registry.markers[userId] = {
						from: userId,
						messageId,
						markerDate: Date.now(),
						type: 'displayed'
					};

					// Update read status for messages up to messageId
					registry.messages.forEach((msg) => {
						if (
							msg.type === MessageType.TEXT_MSG &&
							(msg.stanzaId === messageId || msg.id === messageId)
						) {
							// Mark the message as read by this user
							if (msg.read === MarkerStatus.UNREAD) {
								msg.read = MarkerStatus.READ_BY_SOMEONE;
							}
						}
					});
				}
			}),
			false,
			'CONNECTIONS/UPDATE_READ_MARKER'
		);
	},
	editMessage: (roomId: string, messageId: string, text: string, edited: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					const msg = registry.messages.find(
						(m) => m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.text = text;
						msg.edited = edited;
					}
				}
			}),
			false,
			'CONNECTIONS/EDIT_MESSAGE'
		);
	},
	deleteMessage: (roomId: string, messageId: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					const msg = registry.messages.find(
						(m) => m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.deleted = true;
						msg.text = '';
					}
				}
			}),
			false,
			'CONNECTIONS/DELETE_MESSAGE'
		);
	}
});
