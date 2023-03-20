/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Presence stanzas
 */
// Presence stanza received after a roster iq or when a user logs in
const loginPresenceStanza = `<presence xmlns="jabber:client" from="userId@carbonio/23404c07056f067a1679-319950-697888" to="userId@carbonio/23404c07056f067a1679-319950-697888"/>`;

// Presence stanza received when a user logs out
const logoutPresenceStanza = `<presence xmlns="jabber:client" from="userIde@carbonio/36d4feb9816b11381679-322829-747836" to="userId@carbonio/92f080e7f2dfa5fe1679-320957-345490" type="unavailable"/>`;

/**
 * Inbox stanzas: messages received after an inbox iq
 */

const textMessageFromInbox = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/c7e75930c3382f901679-320886-854829" id="messageId">
    <result xmlns="erlang-solutions.com:xmpp:inbox:0" unread="0" queryid="queryId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T13:58:29.624130Z"/>
            <message to="userId@carbonio" id="messageId" type="groupchat" from="roomId@muclight.carbonio/userId@carbonio">
                <body>hello!</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
            </message>
        </forwarded>
        <box>inbox</box>
        <archive>false</archive>
        <mute>0</mute>
    </result>
</message>`;

const replyMessageFromInbox = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/ccca1b879044b0971679-323677-633848" id="1679-323677-729980">
    <result xmlns="erlang-solutions.com:xmpp:inbox:0" unread="0" queryid="queryId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T14:41:28.291032Z"/>
            <message to="userId@carbonio" id="messageId" type="groupchat" from="roomId@muclight.carbonio/userId@carbonio">
                <body>bene!</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                <reply xmlns="urn:xmpp:reply:0" id="stanzaId" to="userId@carbonio/roomId@muclight.carbonio}"/>
                <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
            </message>
        </forwarded>
        <box>inbox</box>
        <archive>false</archive>
        <mute>0</mute>
    </result>
</message>`;

/**
 * History stanzas
 */

const affiliationMessageFromHistory = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio/d01b4714166cf0531679-320498-378373" id="messageId">
    <result xmlns="urn:xmpp:mam:2" queryid="history" id="stanzaId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T13:49:24.830723Z" from="roomId@muclight.carbonio"/>
            <message xmlns="jabber:client" from="roomId@muclight.carbonio" id="messageId" type="groupchat">
                <x xmlns="urn:xmpp:muclight:0#affiliations">
                    <version>1679-320164-832179</version>
                    <user affiliation="member">userId@carbonio</user>
                </x>
                <body/>
            </message>
        </forwarded>
    </result>
</message>`;

const textMessageFromHistory = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio/92f080e7f2dfa5fe1679-320957-345490" id="messageId">
    <result xmlns="urn:xmpp:mam:2" queryid="history" id="stanzaId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T13:58:29.599694Z" from="roomId@muclight.carbonio/userId@carbonio"/>
            <message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" id="messageId" type="groupchat">
                <body>hello!</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                <x xmlns="http://jabber.org/protocol/muc#user">
                    <item affiliation="member" jid="userId@carbonio/d01b4714166cf0531679-320498-378373" role="participant"/>
                </x>
            </message>
        </forwarded>
    </result>
</message>`;

const replyMessageFromHistory = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/ccca1b879044b0971679-323677-633848" id="messageId">
    <result xmlns="erlang-solutions.com:xmpp:inbox:0" unread="0" queryid="queryId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T14:41:28.291032Z"/>
            <message to="userId@carbonio" id="messageId" type="groupchat" from="roomId@muclight.carbonio/userId@carbonio">
                <body>fine</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                <reply xmlns="urn:xmpp:reply:0" id="stanzaId" to="userId@carbonio/roomId@muclight.carbonio}"/>
                <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
            </message>
        </forwarded>
        <box>inbox</box>
        <archive>false</archive>
        <mute>0</mute>
    </result>
</message>`;

/**
 * Realtime messages
 */

const affiliationMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <x xmlns="urn:xmpp:muclight:0#affiliations">
        <prev-version>1679-320164-756841</prev-version>
        <version>1679-320164-832179</version>
        <user affiliation="member">userId@carbonio</user>
    </x>
    <body/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
</message>`;

const textMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <body>hello!</body>
    <markable xmlns="urn:xmpp:chat-markers:0"/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
</message>`;

const replyMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <body>bene!</body>
    <markable xmlns="urn:xmpp:chat-markers:0"/>
    <reply xmlns="urn:xmpp:reply:0" id="stanzaId" to="userId@carbonio/roomId@muclight.carbonio}"/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomid@muclight.carbonio" id="stanzaId"/>
</message>`;

const displayMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <displayed xmlns="urn:xmpp:chat-markers:0" id="messageId"/>
</message>`;

const pauseWritingMessage = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <paused xmlns="http://jabber.org/protocol/chatstates"/>
</message>`;

const startWritingMessage = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <composing xmlns="http://jabber.org/protocol/chatstates"/>
</message>`;
