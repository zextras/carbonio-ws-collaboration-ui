/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TextMessage } from '../../../types/store/MessageTypes';
import { carbonizeMUC } from './decodeJid';

export function encodeMessage(message: TextMessage): string {
	const { id } = message;
	const to = carbonizeMUC(message.roomId);
	const textMessage = `<body>${message.text}</body>`;
	// TODO attachment and reply
	return `<message xmlns="jabber:client" type="groupchat" to="${to}" id="${id}">${textMessage}</message>`;
}
