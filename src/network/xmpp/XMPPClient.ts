/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';
import { $iq, $msg, $pres, Strophe } from 'strophe.js';
import { v4 as uuidGenerator } from 'uuid';

import {
	MamRequestType,
	onRequestHistory,
	onRequestSingleMessage
} from './handlers/historyMessageHandler';
import { onGetInboxResponse, onSetInboxResponse } from './handlers/inboxMessageHandler';
import { onGetLastActivityResponse } from './handlers/lastActivityHandler';
import { onGetRosterResponse } from './handlers/rosterHandler';
import { onSmartMarkers } from './handlers/smartMarkersHandler';
import { carbonize, carbonizeMUC } from './utility/decodeJid';
import { getLastUnreadMessage } from './utility/getLastUnreadMessage';
import XMPPConnection, { XMPPRequestType } from './XMPPConnection';
import useStore from '../../store/Store';
import IXMPPClient from '../../types/network/xmpp/IXMPPClient';
import { dateToISODate } from '../../utils/dateUtils';
import { RoomsApi } from '../index';

const jabberData = 'jabber:x:data';

class XMPPClient implements IXMPPClient {
	private xmppConnection: XMPPConnection;

	constructor() {
		this.xmppConnection = new XMPPConnection(() => {
			this.getContactList();
			this.setOnline();
			this.setInbox();
		});

		// Useful namespaces
		Strophe.addNamespace('AFFILIATIONS', 'urn:xmpp:muclight:0#affiliations');
		Strophe.addNamespace('CONFIGURATION', 'urn:xmpp:muclight:0#configuration');
		Strophe.addNamespace('CHAT_STATE', 'http://jabber.org/protocol/chatstates');
		Strophe.addNamespace('DISCO_ITEMS', 'http://jabber.org/protocol/disco#items');
		Strophe.addNamespace('DISCO_INFO', 'http://jabber.org/protocol/disco#info');
		Strophe.addNamespace('FORWARD', 'urn:xmpp:forward:0');
		Strophe.addNamespace('INBOX', 'erlang-solutions.com:xmpp:inbox:0');
		Strophe.addNamespace('LAST_ACTIVITY', 'jabber:iq:last');
		Strophe.addNamespace('MAM', 'urn:xmpp:mam:2');
		Strophe.addNamespace('MARKERS', 'urn:xmpp:chat-markers:0');
		Strophe.addNamespace('REPLY', 'urn:xmpp:reply:0');
		Strophe.addNamespace('ROSTER', 'jabber:iq:roster');
		Strophe.addNamespace('SMART_MARKERS', 'esl:xmpp:smart-markers:0');
		Strophe.addNamespace('STANDARD_CLIENT', 'jabber:client');
		Strophe.addNamespace('XMPP_RETRACT', 'urn:esl:message-retract-by-stanza-id:0');
		Strophe.addNamespace('XMPP_FASTEN', 'urn:xmpp:fasten:0');
		Strophe.addNamespace('ZEXTRAS_EDIT', 'zextras:xmpp:edit:0');
	}

	public connect(token: string): void {
		this.xmppConnection.connect(token);
	}

	/**
	 * PRESENCE:
	 * I receive presence events only from users who are on my contact list with a bidirectional subscription.
	 * Automatically, when one_to_one conversation with a certain user starts, this user is added to my contact list,
	 * I'm subscribed to his changes, and he is subscribed to my changes.
	 * For offline contact, request last activity.
	 */

	// Request my contact list
	public getContactList(): void {
		const iq = $iq({ type: 'get' }).c('query', { xmlns: Strophe.NS.ROSTER });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: onGetRosterResponse
		});
	}

	// Send my 'presence' event to all my contacts
	public setOnline(): void {
		this.xmppConnection.send({ type: XMPPRequestType.PRESENCE, elem: $pres() });
	}

	// Request last activity date of a particular user
	public getLastActivity(jid: string): void {
		const iq = $iq({ type: 'get', to: jid }).c('query', { xmlns: Strophe.NS.LAST_ACTIVITY });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: onGetLastActivityResponse
		});
	}

	/**
	 * INBOX:
	 * Request chat initial information like unread messages or active conversations.
	 */

	// Request the supported form
	public getInbox(): void {
		const iq = $iq({ type: 'get' }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: onGetInboxResponse
		});
	}

	// Fetch the inbox and get initial information:
	public setInbox(): void {
		const iq = $iq({ type: 'set' }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: onSetInboxResponse
		});
	}

	/**
	 * MESSAGE:
	 * Control message flow sending messages and request history
	 */

	// Send a text message
	sendChatMessage(roomId: string, message: string): void {
		const placeholderRoom = roomId.split('placeholder-');
		if (placeholderRoom[1]) {
			RoomsApi.replacePlaceholderRoom(placeholderRoom[1], message).then((response) => {
				this.sendChatMessage(response.id, message);
			});
			return;
		}

		// Read messages before sending a new one
		const lastMessageId = getLastUnreadMessage(roomId);
		if (lastMessageId) this.readMessage(roomId, lastMessageId);

		const uuid = uuidGenerator();
		// Set a placeholder message into the store
		useStore.getState().setPlaceholderMessage({ roomId, id: uuid, text: message });

		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('body')
			.t(message)
			.up()
			.c('markable', { xmlns: Strophe.NS.MARKERS });
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	/**
	 * Reply to a message (XEP-0461)
	 * Documentation: https://xmpp.org/extensions/xep-0461.html
	 */
	sendChatMessageReply(
		roomId: string,
		message: string,
		replyTo: string,
		replyMessageId: string
	): void {
		// Read messages before sending a new one
		const lastMessageId = getLastUnreadMessage(roomId);
		if (lastMessageId) this.readMessage(roomId, lastMessageId);

		const to = `${carbonize(replyTo)}/${carbonizeMUC(roomId)}}`;
		const uuid = uuidGenerator();

		// Set a placeholder message into the store
		useStore
			.getState()
			.setPlaceholderMessage({ roomId, id: uuid, text: message, replyTo: replyMessageId });

		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('body')
			.t(message)
			.up()
			.c('markable', { xmlns: Strophe.NS.MARKERS })
			.up()
			.c('reply', { to, id: replyMessageId, xmlns: Strophe.NS.REPLY });
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	/**
	 * Delete a message / Message Retraction (XEP-0424)
	 * Documentation: https://esl.github.io/MongooseDocs/latest/modules/mod_mam/#retraction-on-the-stanza-id
	 */
	sendChatMessageDeletion(roomId: string, messageStanzaId: string): void {
		const uuid = uuidGenerator();
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('apply-to', { id: messageStanzaId, xmlns: Strophe.NS.XMPP_FASTEN })
			.c('retract', { xmlns: Strophe.NS.XMPP_RETRACT });
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	/**
	 * Edit a message using Message Fastening
	 * Documentation: https://xmpp.org/extensions/xep-0422.html
	 */
	sendChatMessageEdit(roomId: string, message: string, messageStanzaId: string): void {
		const uuid = uuidGenerator();
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('apply-to', { id: messageStanzaId, xmlns: Strophe.NS.XMPP_FASTEN })
			.c('edit', { xmlns: Strophe.NS.ZEXTRAS_EDIT })
			.up()
			.c('external', { name: 'body' })
			.up()
			.up()
			.c('body')
			.t(message);
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	// Request the full history of a room
	requestFullHistory(roomId: string): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) }).c('query', {
			xmlns: Strophe.NS.MAM
		});
		this.xmppConnection.send({ type: XMPPRequestType.IQ, elem: iq, callback: onRequestHistory });
	}

	// Request n messages before end date but not before start date
	requestHistory(roomId: string, endHistory: number, quantity: number, unread?: number): void {
		const clearedAt = useStore.getState().rooms[roomId].userSettings?.clearedAt;
		const startHistory = clearedAt || useStore.getState().rooms[roomId].createdAt;
		// Ask for ${QUANTITY} messages before end date but not before start date
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: MamRequestType.HISTORY })
			.c('x', { type: 'submit', xmlns: jabberData })
			.c('field', { var: 'FORM_TYPE', type: 'hidden' })
			.c('value')
			.t('urn:xmpp:mam:2')
			.up()
			.up()
			.c('field', { var: 'start' })
			.c('value')
			.t(dateToISODate(startHistory))
			.up()
			.up()
			.c('field', { var: 'end' })
			.c('value')
			.t(dateToISODate(endHistory))
			.up()
			.up()
			.up()
			.c('set', { xmlns: 'http://jabber.org/protocol/rsm' })
			.c('max')
			.t(quantity)
			.up()
			.c('before');
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => onRequestHistory(stanza, unread)
		});
	}

	requestHistoryBetweenTwoMessage(
		roomId: string,
		olderMessageId: string,
		newerMessageId: string
	): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM })
			.c('x', { xmlns: jabberData })
			.c('field', { var: 'from_id' })
			.c('value')
			.t(olderMessageId)
			.up()
			.up()
			.c('field', { var: 'to_id' })
			.c('value')
			.t(newerMessageId);
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: onRequestHistory
		});
	}

	requestMessageSubjectOfReply(
		roomId: string,
		messageSubjectOfReplyId: string,
		replyMessageId: string
	): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: MamRequestType.REPLIED })
			.c('x', { xmlns: jabberData })
			.c('field', { var: 'from_id' })
			.c('value')
			.t(messageSubjectOfReplyId)
			.up()
			.up()
			.c('field', { var: 'to_id' })
			.c('value')
			.t(messageSubjectOfReplyId);
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => onRequestSingleMessage(stanza, replyMessageId)
		});
	}

	requestMessageToForward(roomId: string, messageToForwardStanzaId: string): Promise<Element> {
		return new Promise((resolve, reject) => {
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
				.c('query', { xmlns: Strophe.NS.MAM, queryid: MamRequestType.FORWARDED })
				.c('x', { xmlns: jabberData })
				.c('field', { var: 'from_id' })
				.c('value')
				.t(messageToForwardStanzaId)
				.up()
				.up()
				.c('field', { var: 'to_id' })
				.c('value')
				.t(messageToForwardStanzaId);
			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq,
				callback: resolve,
				errorCallback: reject
			});
		});
	}

	/**
	 * CHAT STATE:
	 * Control 'isWriting' information by sending 'composing' or 'paused' events.
	 */

	// Send "I'm typing" information to all the users on the room
	sendIsWriting(roomId: string): void {
		// Avoid sending isWriting events to placeholder rooms
		if (useStore.getState().rooms[roomId]?.placeholder) return;

		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('composing', {
			xmlns: Strophe.NS.CHAT_STATE
		});
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	// Sending a paused event to all users on the room
	sendPaused(roomId: string): void {
		// Avoid sending paused events to placeholder rooms
		if (useStore.getState().rooms[roomId]?.placeholder) return;

		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('paused', {
			xmlns: Strophe.NS.CHAT_STATE
		});
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	/**
	 * MARKERS
	 * Functions to control the read / unread state of a message
	 */

	// Send confirmation that I read a certain message
	readMessage(roomId: string, messageId: string): void {
		const message = find(
			useStore.getState().messages[roomId],
			(message) => message.id === messageId
		);
		if (message) {
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('displayed', {
				xmlns: Strophe.NS.MARKERS,
				id: messageId
			});
			this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
		}
	}

	// Request last message read date of all the members of a room
	lastMarkers(roomId: string): void {
		const iq = $iq({ type: 'get' }).c('query', {
			xmlns: Strophe.NS.SMART_MARKERS,
			peer: carbonizeMUC(roomId)
		});
		this.xmppConnection.send({ type: XMPPRequestType.IQ, elem: iq, callback: onSmartMarkers });
	}
}

export default XMPPClient;
