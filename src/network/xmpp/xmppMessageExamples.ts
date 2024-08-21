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
export const onlinePresence = `<presence xmlns="jabber:client" from="userId@carbonio/resourceId" to="userId@carbonio/resourceId"/>`;

// Presence stanza received when a user logs out
export const offlinePresence = `<presence xmlns="jabber:client" from="userId@carbonio/resourceId" to="userId@carbonio/resourceId" type="unavailable"/>`;

/**
 * Ping stanzas
 */
export const pingIq = `<iq from='carbonio' to='userId@carbonio/resourceId' type='get' id='stanzaId' xmlns='jabber:client'><ping xmlns='urn:xmpp:ping'/></iq>`;

export const pongIq = `<iq id="stanzaId" to="carbonio" type="result" xmlns="jabber:client"/>`;

/**
 * Inbox stanzas: messages received after an inbox iq
 */

export const textMessageFromInbox = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/resourceId" id="messageId">
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

export const replyMessageFromInbox = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/resourceId" id="messageId">
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

export const forwardedTextMessageFromInbox = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/resourceId" id="messageId">
    <result xmlns="erlang-solutions.com:xmpp:inbox:0" unread="0" queryid="queryId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-23T08:22:36.564202Z"/>
            <message to="userId@carbonio" id="messageId" type="groupchat" from="roomId@muclight.carbonio/userId@carbonio">
                <body/>
                <forwarded xmlns="urn:xmpp:forward:0">
                    <delay xmlns="urn:xmpp:delay" stamp="2023-03-23T08:22:24.457Z"/>
                    <message from="roomId@muclight.carbonio/userId@carbonio" id="messageId" to="roomId@muclight.carbonio" type="groupchat">
                        <body>Hello!</body>
                    </message>
                </forwarded>
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

export const affiliationMessageFromHistory = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio/resourceId" id="messageId">
    <result xmlns="urn:xmpp:mam:2" queryid="history" id="stanzaId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="timestamp" from="roomId@muclight.carbonio"/>
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

export const textMessageFromHistory = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio/resourceId" id="messageId">
    <result xmlns="urn:xmpp:mam:2" queryid="history" id="stanzaId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-20T13:58:29.599694Z" from="roomId@muclight.carbonio/userId@carbonio"/>
            <message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" id="messageId" type="groupchat">
                <body>hello!</body>
                <markable xmlns="urn:xmpp:chat-markers:0"/>
                <x xmlns="http://jabber.org/protocol/muc#user">
                    <item affiliation="member" jid="userId@carbonio/resourceId" role="participant"/>
                </x>
            </message>
        </forwarded>
    </result>
</message>`;

export const replyMessageFromHistory = `
<message xmlns="jabber:client" from="userId@carbonio" to="userId@carbonio/resourceId" id="messageId">
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

export const forwardedTextMessageFromHistory = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio/resourceId" id="messageId">
    <result xmlns="urn:xmpp:mam:2" queryid="history" id="stanzaId">
        <forwarded xmlns="urn:xmpp:forward:0">
            <delay xmlns="urn:xmpp:delay" stamp="2023-03-23T08:22:36.533016Z" from="roomId@muclight.carbonio/userId@carbonio"/>
                <message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" id="messageId" type="groupchat">
                    <body/>
                    <forwarded xmlns="urn:xmpp:forward:0">
                        <delay xmlns="urn:xmpp:delay" stamp="2023-03-23T08:22:24.457Z"/>
                        <message from="roomId@muclight.carbonio/userId@carbonio" id="messageId" to="roomId@muclight.carbonio" type="groupchat">
                            <body>Hello!</body>
                        </message>
                    </forwarded>
                    <x xmlns="http://jabber.org/protocol/muc#user">
                        <item affiliation="member" jid="userId@carbonio" role="participant"/>
                    </x>
            </message>
        </forwarded>
    </result>
</message>`;

/**
 * Realtime messages
 */

export const affiliationMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <x xmlns="urn:xmpp:muclight:0#affiliations">
        <prev-version>1679-320164-756841</prev-version>
        <version>1679-320164-832179</version>
        <user affiliation="member">userId@carbonio</user>
    </x>
    <body/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
</message>`;

export const textMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <body>hello!</body>
    <markable xmlns="urn:xmpp:chat-markers:0"/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
</message>`;

export const replyMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <body>bene!</body>
    <markable xmlns="urn:xmpp:chat-markers:0"/>
    <reply xmlns="urn:xmpp:reply:0" id="stanzaId" to="userId@carbonio/roomId@muclight.carbonio}"/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomid@muclight.carbonio" id="stanzaId"/>
</message>`;

export const forwardedTextMessage = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <body/>
    <forwarded xmlns="urn:xmpp:forward:0">
        <delay xmlns="urn:xmpp:delay" stamp="2023-03-23T08:22:24.457Z"/>
        <message from="roomId@muclight.carbonio/userId@carbonio" id="messageId" to="roomId@muclight.carbonio" type="groupchat">
            <body>Hello!</body>
        </message>
    </forwarded>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="stanzaId"/>
</message>`;

export const messageWithAttachment = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <x xmlns="urn:xmpp:muclight:0#configuration">
        <operation>attachmentAdded</operation>
        <attachment-id>attachmentId</attachment-id>
        <filename>imageName</filename>
        <mime-type>image/jpeg</mime-type>
        <size>384890</size>
    </x>
    <body/>
    <stanza-id xmlns="urn:xmpp:sid:0" by="roomId@muclight.carbonio" id="BTSDPG086R81"/>
</message>`;

export const displayMessageRealTime = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <displayed xmlns="urn:xmpp:chat-markers:0" id="messageId"/>
</message>`;

export const pauseWritingMessage = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <paused xmlns="http://jabber.org/protocol/chatstates"/>
</message>`;

export const startWritingMessage = `
<message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" id="messageId" type="groupchat">
    <composing xmlns="http://jabber.org/protocol/chatstates"/>
</message>`;

export const retractedMessage = `
    <message xmlns="jabber:client" from="roomId@muclight.carbonio/userId@carbonio" id="messageId" type="groupchat">
        <retracted xmlns="urn:esl:message-retract-by-stanza-id:0" stamp="date">
            <stanza-id xmlns="urn:xmpp:sid:0" id="stanzaId" by="roomId@muclight.carbonio"/>
        </retracted>
    </message>`;

export const reactionMessage = `
    <message id="messageId" from="roomId@muclight.carbonio/userId@carbonio" to="userId@carbonio" type="groupchat" xmlns="jabber:client">
        <apply-to id="originalStanzaId" xmlns="urn:xmpp:fasten:0"><reaction xmlns="zextras:xmpp:reaction:0"/>
            <external name="body"/>
        </apply-to>
        <body>👍</body>
    </message>`;
