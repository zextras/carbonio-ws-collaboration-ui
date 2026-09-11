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
import { MarkerStatus, MessageType } from '../../types/store/ChatsRegistryTypes';
import { ConnectionsStoreSlice } from '../../types/store/ConnectionsTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const useConnectionsStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ConnectionsStoreSlice
> = (set) => ({
	connections: {
		wsClient: new WebSocketClient(),
		status: {},
		isMongooseIM: undefined,
		messagingBackend: undefined
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
				draft.connections.status.messageBroker = status;
			}),
			false,
			'CONNECTIONS/SET_WEBSOCKET_STATUS'
		);
	},
	setMessageBrokerStatus: (status: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.status.messageBroker = status;
			}),
			false,
			'CONNECTIONS/SET_MESSAGE_BROKER_STATUS'
		);
	},
	setIsMongooseIM: (isMongooseIM: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.isMongooseIM = isMongooseIM;
			}),
			false,
			'CONNECTIONS/SET_IS_MONGOOSE_IM'
		);
	},
	setMessagingBackend: (backend): void => {
		set(
			produce((draft: RootStore) => {
				draft.connections.messagingBackend = backend;
			}),
			false,
			'CONNECTIONS/SET_MESSAGING_BACKEND'
		);
	},
	resetXmppData: (): void => {
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
			'CONNECTIONS/RESET_XMPP_DATA'
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
	updateReadMarker: (roomId: string, userId: string, lastReadAt: number): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (!registry) return;
				if (!registry.markers) registry.markers = {};

				const existing = registry.markers[userId];
				if (existing && existing.lastReadAt >= lastReadAt) return;
				registry.markers[userId] = { from: userId, lastReadAt, type: 'displayed' };

				const myId = draft.session.id;
				if (registry.messages?.length && myId) {
					registry.messages = registry.messages.map((msg) => {
						if (
							msg.type === MessageType.TEXT_MSG &&
							msg.from === myId &&
							msg.date <= lastReadAt &&
							msg.read === MarkerStatus.UNREAD
						) {
							return { ...msg, read: MarkerStatus.READ };
						}
						return msg;
					});
				}
				if (
					registry.lastMessage &&
					registry.lastMessage.type === MessageType.TEXT_MSG &&
					(registry.lastMessage as any).from === myId &&
					registry.lastMessage.date <= lastReadAt &&
					registry.lastMessage.read === MarkerStatus.UNREAD
				) {
					registry.lastMessage = { ...registry.lastMessage, read: MarkerStatus.READ };
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
						(m) =>
							m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.text = text;
						msg.edited = true;
						msg.editedInfo = { editedAt };
					}
				}
				// Also update lastMessage if it refers to the same message
				if (registry?.lastMessage) {
					const lm = registry.lastMessage as any;
					if (lm.id === messageId || lm.stanzaId === messageId) {
						registry.lastMessage = {
							...registry.lastMessage,
							text,
							edited: true,
							editedInfo: { editedAt }
						} as any;
					}
				}
			}),
			false,
			'CONNECTIONS/EDIT_MESSAGE'
		);
	},
	deleteMessage: (
		roomId: string,
		messageId: string,
		deletedBy: string,
		deletedAt: string
	): void => {
		set(
			produce((draft: RootStore) => {
				const registry = draft.chatsRegistry[roomId];
				if (registry && registry.messages) {
					const msg = registry.messages.find(
						(m) =>
							m.id === messageId || (m.type === MessageType.TEXT_MSG && m.stanzaId === messageId)
					);
					if (msg && msg.type === MessageType.TEXT_MSG) {
						msg.deleted = true;
						msg.text = '';
						msg.deletedInfo = { deletedBy, deletedAt };
					}
				}
				// Also update lastMessage if it refers to the same message
				if (registry?.lastMessage) {
					const lm = registry.lastMessage as any;
					if (lm.id === messageId || lm.stanzaId === messageId) {
						registry.lastMessage = {
							...registry.lastMessage,
							text: '',
							deleted: true,
							deletedInfo: { deletedBy, deletedAt }
						} as any;
					}
				}
			}),
			false,
			'CONNECTIONS/DELETE_MESSAGE'
		);
	}
});
