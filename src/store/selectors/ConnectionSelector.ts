/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import XMPPClient from '../../network/xmpp/XMPPClient';
import IWebSocketClient from '../../types/network/websocket/IWebSocketClient';
import { RootStore } from '../../types/store/StoreTypes';

export const getXmppClient = (store: RootStore): XMPPClient => store.connections.xmppClient;

export const getWsClient = (store: RootStore): IWebSocketClient => store.connections.wsClient;
