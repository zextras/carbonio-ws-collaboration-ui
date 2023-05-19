/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Debug WebSocket events
import { WsEvent } from '../types/network/websocket/wsEvents';

export const wsDebug = (text: string, object?: WsEvent): void =>
	console.log(
		`%c CHATS WS [${new Date().toISOString().slice(11, -5)}]: ${text}`,
		'color: Green',
		object || ''
	);

// Debug XMPP events
export const xmppDebug = (text: string, object?: Element): void => {
	console.log(
		`%c CHATS XMPP [${new Date().toISOString().slice(11, -5)}]: ${text}`,
		'color: Violet',
		object || ''
	);
};
