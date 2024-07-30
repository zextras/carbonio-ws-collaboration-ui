/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	offlinePresence,
	onlinePresence,
	pauseWritingMessage,
	pingIq,
	pongIq,
	startWritingMessage
} from '../../network/xmpp/xmppMessageExamples';

export const strStanzaToXml = (str: string): Element => {
	const parser = new DOMParser();
	return parser.parseFromString(str, 'application/xml').documentElement;
};

export const onlinePresenceStanza = (userId: string): Element => {
	const iqStanza = onlinePresence.replace('userId', userId);
	return strStanzaToXml(iqStanza);
};

export const offlinePresenceStanza = (userId: string): Element => {
	const iqStanza = offlinePresence.replace('userId', userId);
	return strStanzaToXml(iqStanza);
};

export const pingStanza = (stanzaId: string): Element => {
	const iqStanza = pingIq.replace('stanzaId', stanzaId);
	return strStanzaToXml(iqStanza);
};

export const pongStanza = (stanzaId: string): Element => {
	const iqStanza = pongIq.replace('stanzaId', stanzaId);
	return strStanzaToXml(iqStanza);
};

export const composingStanza = (roomId: string, from: string): Element => {
	const messageStanza = startWritingMessage.replace('roomId', roomId).replace('userId', from);
	return strStanzaToXml(messageStanza);
};

export const pausedStanza = (roomId: string, from: string): Element => {
	const messageStanza = pauseWritingMessage.replace('roomId', roomId).replace('userId', from);
	return strStanzaToXml(messageStanza);
};
