/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { forEach } from 'lodash';
import { StateCreator } from 'zustand';

import { ConnectionsStoreSlice } from '../../types/store/ConnectionsTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const useConnectionsStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	ConnectionsStoreSlice
> = (set) => ({
	connections: {
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
	}
});
