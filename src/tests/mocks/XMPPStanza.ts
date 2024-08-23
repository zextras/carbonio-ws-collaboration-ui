/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	endRequestHistoryIq,
	offlinePresence,
	onlinePresence,
	pauseWritingMessage,
	pingIq,
	pongIq,
	reactionMessage,
	reactionMessageStanzaFromHistory,
	replyMessageFromHistory,
	startWritingMessage,
	textMessageFromHistory
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

export const historyTextMessageStanza = (
	roomId: string,
	from: string,
	body: string,
	queryId: string
): Element => {
	const messageToParse = textMessageFromHistory
		.replace('roomId', roomId)
		.replace('from', from)
		.replace('body', body)
		.replace('queryId', queryId);
	return strStanzaToXml(messageToParse);
};

export const replyTextMessageStanza = (
	roomId: string,
	from: string,
	body: string,
	queryId: string,
	replyTo: string
): Element => {
	const messageToParse = replyMessageFromHistory
		.replace('roomId', roomId)
		.replace('from', from)
		.replace('body', body)
		.replace('queryId', queryId)
		.replace('replyTo', replyTo);
	return strStanzaToXml(messageToParse);
};

export const reactionMessageStanza = (
	roomId: string,
	originalStanzaId: string,
	userId: string
): Element => {
	const messageToParse = reactionMessage
		.replace('roomId', roomId)
		.replace('originalStanzaId', originalStanzaId)
		.replace('userId', userId);
	return strStanzaToXml(messageToParse);
};

export const reactionMessageFromHistoryStanza = (
	roomId: string,
	originalStanzaId: string,
	userId: string,
	queryId: string
): Element => {
	const messageToParse = reactionMessageStanzaFromHistory
		.replace('roomId', roomId)
		.replace('originalStanzaId', originalStanzaId)
		.replace('userId', userId)
		.replace('queryId', queryId);
	return strStanzaToXml(messageToParse);
};

export const endRequestHistoryStanza = (roomId: string, complete: boolean): Element => {
	const messageToParse = endRequestHistoryIq
		.replace('roomId', roomId)
		.replace("complete='true'", complete ? "complete='true'" : '');
	return strStanzaToXml(messageToParse);
};
