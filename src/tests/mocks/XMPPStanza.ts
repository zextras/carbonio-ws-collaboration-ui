/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { pauseWritingMessage, startWritingMessage } from '../../network/xmpp/xmppMessageExamples';

export const composingStanza = (roomId: string, from: string): Element => {
	const parser = new DOMParser();
	const messageStanza = startWritingMessage.replace('roomId', roomId).replace('userId', from);
	const xmlToParse = parser.parseFromString(messageStanza, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
};

export const pausedStanza = (roomId: string, from: string): Element => {
	const parser = new DOMParser();
	const messageStanza = pauseWritingMessage.replace('roomId', roomId).replace('userId', from);
	const xmlToParse = parser.parseFromString(messageStanza, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
};
