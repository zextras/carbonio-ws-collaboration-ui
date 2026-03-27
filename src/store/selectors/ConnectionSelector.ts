/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import IWebSocketClient from '../../types/network/websocket/IWebSocketClient';
import { RootStore } from '../../types/store/StoreTypes';

export const getWsClient = (store: RootStore): IWebSocketClient => store.connections.wsClient;

export const getChatConnectionId = (store: RootStore): string | undefined =>
	store.connections.chatConnectionId;
