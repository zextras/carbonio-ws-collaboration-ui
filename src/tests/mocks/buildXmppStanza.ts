/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const stringToXml = (str: string): Element => {
	const parser = new DOMParser();
	return parser.parseFromString(str, 'application/xml').documentElement;
};

/**
 * PING IQ
 */

type PingParams = {
	to?: string;
	resourceId?: string;
	pingId?: string;
};
export const buildPingStanza = ({
	to = 'userId',
	resourceId = 'resourceId',
	pingId = 'pingId'
}: PingParams = {}): Element =>
	stringToXml(
		`<iq from='carbonio' to='${to}@carbonio/${resourceId}' type='get' id='${pingId}' xmlns='jabber:client'><ping xmlns='urn:xmpp:ping'/></iq>`
	);

/**
 * PRESENCE STANZAS
 */

type PresenceStanzaParams = {
	from: string;
	to?: string;
	resourceId?: string;
	online?: boolean;
};
export const buildPresenceStanza = ({
	from,
	to = 'userId',
	resourceId = 'resourceId',
	online = true
}: PresenceStanzaParams): Element => {
	const typeAttr = online ? '' : ' type="unavailable"';
	return stringToXml(
		`<presence xmlns="jabber:client" from="${from}@carbonio/${resourceId}" to="${to}@carbonio/${resourceId}"${typeAttr}/>`
	);
};

/**
 * REALTIME MESSAGES
 */

type ReactionMessageParams = {
	roomId: string;
	from: string;
	to?: string;
	originalStanzaId: string;
	emoji?: string;
	messageId?: string;
};
export const buildReactionStanza = ({
	roomId,
	from,
	to = 'userId',
	originalStanzaId,
	emoji = '👍',
	messageId = 'messageId'
}: ReactionMessageParams): Element =>
	stringToXml(`
    <message id="${messageId}" from="${roomId}@muclight.carbonio/${from}@carbonio" to="${to}@carbonio" type="groupchat" xmlns="jabber:client">
        <apply-to id="${originalStanzaId}" xmlns="urn:xmpp:fasten:0">
            <reaction xmlns="zextras:xmpp:reaction:0"/>
            <external name="body"/>
        </apply-to>
        <body>${emoji}</body>
    </message>`);

type ComposingParams = {
	roomId: string;
	from: string;
	to?: string;
	messageId?: string;
	isWriting: boolean;
};
export const buildComposingStanza = ({
	roomId,
	from,
	to = 'userId',
	messageId = 'messageId',
	isWriting
}: ComposingParams): Element => {
	const stateTag = isWriting
		? '<composing xmlns="http://jabber.org/protocol/chatstates"/>'
		: '<paused xmlns="http://jabber.org/protocol/chatstates"/>';

	return stringToXml(`
<message xmlns="jabber:client" from="${roomId}@muclight.carbonio/${from}@carbonio" to="${to}@carbonio" id="${messageId}" type="groupchat">
    ${stateTag}
</message>`);
};

/**
 * HISTORY MESSAGES
 */

type HistoryParams = {
	roomId?: string;
	from?: string;
	to?: string;
	text?: string;
	queryId?: string;
	messageId?: string;
	stanzaId?: string;
	timestamp?: string;
	replyTo?: string;
};
export const buildTextMessageFromHistory = ({
	roomId = 'roomId',
	from = 'userId',
	to = 'userId',
	text = 'text message',
	queryId = 'queryId',
	messageId = 'messageId',
	stanzaId = 'stanzaId',
	timestamp = new Date().toISOString(),
	replyTo
}: HistoryParams): Element => {
	const replyToTag = replyTo
		? `<reply xmlns="urn:xmpp:reply:0" id="${replyTo}" to="${to}@carbonio/${roomId}@muclight.carbonio"/>`
		: '';
	return stringToXml(`
<message xmlns="jabber:client" from="${roomId}@muclight.carbonio" to="${to}@carbonio/resourceId" id="${messageId}">
    <result xmlns="urn:xmpp:mam:2" queryid="${queryId}" id="${stanzaId}">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="${timestamp}" from="${roomId}@muclight.carbonio/${from}@carbonio"/>
            <message xmlns="jabber:client" from="${roomId}@muclight.carbonio/${from}@carbonio" id="${messageId}" type="groupchat">
                <body>${text}</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                ${replyToTag}
                <x xmlns="http://jabber.org/protocol/muc#user">
                    <item affiliation="member" jid="${from}@carbonio/resourceId" role="participant"/>
                </x>
            </message>
        </forwarded>
    </result>
</message>`);
};

type ReactionHistoryParams = {
	roomId?: string;
	from?: string;
	to?: string;
	reaction?: string;
	queryId?: string;
	messageId?: string;
	stanzaId?: string;
	originalStanzaId?: string;
	timestamp?: string;
};
export const buildReactionMessageFromHistory = ({
	roomId = 'roomId',
	from = 'userId',
	to = 'userId',
	reaction = '👍',
	queryId = 'history',
	messageId = 'messageId',
	stanzaId = 'stanzaId',
	originalStanzaId = 'originalStanzaId',
	timestamp = '2023-03-23T08:22:36.533016Z'
}: ReactionHistoryParams): Element =>
	stringToXml(`
<message xmlns="jabber:client" from="${roomId}@muclight.carbonio" to="${to}@carbonio/resourceId" id="${messageId}">
    <result xmlns="urn:xmpp:mam:2" queryid="${queryId}" id="${stanzaId}">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="${timestamp}" from="${roomId}@muclight.carbonio/${from}@carbonio"/>
            <message id="${messageId}" from="${roomId}@muclight.carbonio/${from}@carbonio" to="${to}@carbonio" type="groupchat" xmlns="jabber:client">
                <apply-to id="${originalStanzaId}" xmlns="urn:xmpp:fasten:0">
                    <reaction xmlns="zextras:xmpp:reaction:0"/>
                    <external name="body"/>
                </apply-to>
                <body>${reaction}</body>
            </message>
        </forwarded>
    </result>
</message>`);

type EndRequestHistoryParams = {
	roomId?: string;
	to?: string;
	isComplete?: boolean;
	iqId?: string;
	firstIndex?: string;
	firstId?: string;
	lastId?: string;
	count?: number;
};
export const buildEndRequestHistoryStanza = ({
	roomId = 'roomId',
	to = 'userId',
	isComplete = true,
	iqId = 'iqId',
	firstIndex = '100',
	firstId = 'firstStanzaId',
	lastId = 'lastStanzaId',
	count = 100
}: EndRequestHistoryParams): Element => {
	const completeParam = isComplete ? " complete='true'" : '';
	return stringToXml(`
<iq from='${roomId}@muclight.carbonio' to='${to}@carbonio/resourceId' id='${iqId}' type='result' xmlns='jabber:client'>
    <fin xmlns='urn:xmpp:mam:2'${completeParam}>
        <set xmlns='http://jabber.org/protocol/rsm'>
            <first index='${firstIndex}'>${firstId}</first>
            <last>${lastId}</last>
            <count>${count}</count>
        </set>
    </fin>
</iq>`);
};
