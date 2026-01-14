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
				console.log('[updateReadMarker] Called with:', { roomId, userId, messageId });

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

					// Find the target message to get its date
					const targetMessage = registry.messages.find(
						(m) =>
							m.type === MessageType.TEXT_MSG &&
							(m.stanzaId === messageId || m.id === messageId)
					);

					if (targetMessage) {
						const targetDate = targetMessage.date;
						const myId = draft.session.id;

						// Create new array with updated read status to ensure re-render
						registry.messages = registry.messages.map((msg) => {
							if (
								msg.type === MessageType.TEXT_MSG &&
								msg.from === myId &&
								msg.date <= targetDate &&
								msg.read === MarkerStatus.UNREAD
							) {
								// Return new object with updated read status
								return { ...msg, read: MarkerStatus.READ };
							}
							return msg;
						});

						console.log('[updateReadMarker] Messages updated with READ status');
					}
				}
			}),
			false,
			'CONNECTIONS/UPDATE_READ_MARKER'
		);
	},
	editMessage: (roomId: string, messageId: string, text: string, editedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					const msg = registry.messages.find(
						(m) => m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.text = text;
						msg.editedInfo = { editedAt };
					}
				}
			}),
			false,
			'CONNECTIONS/EDIT_MESSAGE'
		);
	},
	deleteMessage: (roomId: string, messageId: string, deletedBy: string, deletedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					const msg = registry.messages.find(
						(m) => m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.deletedInfo = { deletedBy, deletedAt };
						msg.text = '';
					}
				}
			}),
			false,
			'CONNECTIONS/DELETE_MESSAGE'
		);
	}
});
