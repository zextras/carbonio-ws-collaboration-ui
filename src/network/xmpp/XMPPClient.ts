/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';
import { $iq, $msg, $pres, Strophe } from 'strophe.js';
import { v4 as uuidGenerator } from 'uuid';

import { RoomsApi } from '../index';
import { fullHistoryCallback } from './iqCallbacks/fullHistoryCallback';
import { lastActivityCallback } from './iqCallbacks/lastActivityCallback';
import { requestHistoryCallback } from './iqCallbacks/requestHistoryCallback';
import { rosterCallback } from './iqCallbacks/rosterCallback';
import { smartMarkersCallback } from './iqCallbacks/smartMarkersCallback';
import { carbonize, carbonizeMUC, domain } from './utility/decodeJid';
import { getLastUnreadMessage } from './utility/getLastUnreadMessage';
import HistoryAccumulator from './utility/HistoryAccumulator';
import { sanitizeXmppMessage } from './utility/sanitizeXmppMessage';
import XMPPConnection, { XMPPRequestType } from './XMPPConnection';
import useStore from '../../store/Store';
import IXMPPClient from '../../types/network/xmpp/IXMPPClient';
import { dateToISODate } from '../../utils/dateUtils';

const jabberData = 'jabber:x:data';

class XMPPClient implements IXMPPClient {
	public xmppConnection: XMPPConnection;

	constructor() {
		this.xmppConnection = new XMPPConnection(() => {
			this.setInbox();
			this.getContactList();
			this.setOnline();
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
		Strophe.addNamespace('RSM', 'http://jabber.org/protocol/rsm');
		Strophe.addNamespace('MARKERS', 'urn:xmpp:chat-markers:0');
		Strophe.addNamespace('PING', 'urn:xmpp:ping');
		Strophe.addNamespace('REPLY', 'urn:xmpp:reply:0');
		Strophe.addNamespace('ROSTER', 'jabber:iq:roster');
		Strophe.addNamespace('SMART_MARKERS', 'esl:xmpp:smart-markers:0');
		Strophe.addNamespace('STANDARD_CLIENT', 'jabber:client');
		Strophe.addNamespace('XMPP_RETRACT', 'urn:esl:message-retract-by-stanza-id:0');
		Strophe.addNamespace('XMPP_FASTEN', 'urn:xmpp:fasten:0');
		Strophe.addNamespace('ZEXTRAS_EDIT', 'zextras:xmpp:edit:0');
		Strophe.addNamespace('ZEXTRAS_REACTION', 'zextras:xmpp:reaction:0');
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
			callback: rosterCallback
		});
	}

	// Send my 'presence' event to all my contacts
	public setOnline(): void {
		this.xmppConnection.send({ type: XMPPRequestType.PRESENCE, elem: $pres() });
	}

	public sendPong(ping: Element): void {
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: $iq({ type: 'result', to: domain, id: ping.getAttribute('id') })
		});
	}

	// Request last activity date of a particular user
	public getLastActivity(jid: string): void {
		const iq = $iq({ type: 'get', to: jid }).c('query', { xmlns: Strophe.NS.LAST_ACTIVITY });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: lastActivityCallback
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
			elem: iq
		});
	}

	// Fetch the inbox and get initial information:
	public setInbox(): void {
		const iq = $iq({ type: 'set' }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq
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
			.t(sanitizeXmppMessage(message))
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
			.t(sanitizeXmppMessage(message))
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
			.t(sanitizeXmppMessage(message));
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	sendChatMessageReaction(roomId: string, messageStanzaId: string, reaction: string): void {
		const uuid = uuidGenerator();
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('apply-to', { id: messageStanzaId, xmlns: Strophe.NS.XMPP_FASTEN })
			.c('reaction', { xmlns: Strophe.NS.ZEXTRAS_REACTION })
			.up()
			.c('external', { name: 'body' })
			.up()
			.up()
			.c('body')
			.t(reaction);
		this.xmppConnection.send({ type: XMPPRequestType.MESSAGE, elem: msg });
	}

	// Request n messages before end date but not before start date
	requestHistory(roomId: string, endHistory: number, quantity: number, unread?: number): void {
		if (!useStore.getState().rooms[roomId]) return;
		const clearedAt = useStore.getState().rooms[roomId].userSettings?.clearedAt;
		const startHistory = clearedAt ?? useStore.getState().rooms[roomId].createdAt;
		const queryId = HistoryAccumulator.getNextId();
		// Ask for ${QUANTITY} messages before end date but not before start date
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
			.c('x', { type: 'submit', xmlns: jabberData })
			.c('field', { var: 'FORM_TYPE', type: 'hidden' })
			.c('value')
			.t(Strophe.NS.MAM)
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
			.c('set', { xmlns: Strophe.NS.RSM })
			.c('max')
			.t(quantity)
			.up()
			.c('before');
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => requestHistoryCallback(stanza, queryId, unread)
		});
	}

	requestMessageSubjectOfReply(
		roomId: string,
		messageSubjectOfReplyId: string,
		replyMessageId: string
	): void {
		if (!useStore.getState().rooms[roomId]) return;
		const queryId = HistoryAccumulator.getNextId();
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
			.c('x', { xmlns: jabberData })
			.c('field', { var: 'ids' })
			.c('value')
			.t(messageSubjectOfReplyId);
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: () => {
				const referenceMessage = HistoryAccumulator.getRepliedMessage(queryId);
				const { setRepliedMessage } = useStore.getState();
				setRepliedMessage(referenceMessage.roomId, replyMessageId, referenceMessage);
			}
		});
	}

	requestMessageToForward(
		roomId: string,
		messageToForwardStanzaId: string,
		queryId: string
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
				.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
				.c('x', { xmlns: jabberData })
				.c('field', { var: 'ids' })
				.c('value')
				.t(messageToForwardStanzaId);
			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq,
				callback: () => resolve(),
				errorCallback: reject
			});
		});
	}

	requestFullHistory(roomId: string, from?: number): void {
		if (!useStore.getState().rooms[roomId]) return;
		const room = useStore.getState().rooms[roomId];
		const clearedAt = room.userSettings?.clearedAt;
		const startHistory = from ?? clearedAt ?? room.createdAt;

		const queryId = HistoryAccumulator.getNextId();
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
			.c('x', { type: 'submit', xmlns: jabberData })
			.c('field', { var: 'FORM_TYPE', type: 'hidden' })
			.c('value')
			.t(Strophe.NS.MAM)
			.up()
			.up()
			.c('field', { var: 'start' })
			.c('value')
			.t(dateToISODate(startHistory));
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => fullHistoryCallback(stanza, queryId)
		});
	}

	// Retrieve all messages of a room with a particular text in the body
	fullTextSearch(roomId: string, text: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const queryId = HistoryAccumulator.getNextId();
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
				.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
				.c('x', { xmlns: jabberData })
				.c('field', { var: 'full-text-search' })
				.c('value')
				.t(text)
				.up()
				.up()
				.up()
				.c('set', { xmlns: Strophe.NS.RSM })
				.c('before');
			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq,
				callback: () => {
					const searchedMessages = HistoryAccumulator.getSearchedMessages(queryId);
					useStore.getState().setSearchResults(roomId, searchedMessages);
					resolve();
				},
				errorCallback: reject
			});
		});
	}

	/**
	 * Request messages between two stanza IDs to fill gaps
	 * @param roomId - Room identifier
	 * @param afterStanzaId - Older message stanza ID (lower bound)
	 * @param beforeStanzaId - Newer message stanza ID (upper bound)
	 */
	requestHistoryBetweenTwoIds(roomId: string, afterStanzaId: string, beforeStanzaId: string): void {
		if (!useStore.getState().rooms[roomId]) return;

		const queryId = HistoryAccumulator.getNextId();
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
			.c('x', { type: 'submit', xmlns: jabberData })
			.c('field', { var: 'FORM_TYPE', type: 'hidden' })
			.c('value')
			.t(Strophe.NS.MAM)
			.up()
			.up()
			.c('field', { var: 'from-id' })
			.c('value')
			.t(afterStanzaId)
			.up()
			.up()
			.c('field', { var: 'to-id' })
			.c('value')
			.t(beforeStanzaId);

		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => requestHistoryCallback(stanza, queryId, undefined, true)
		});
	}

	requestMessageResultHistoryToId(
		roomId: string,
		stanzaId: string,
		withRequestedId: boolean = false
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const queryId = HistoryAccumulator.getNextId();
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
				.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
				.c('x', { type: 'submit', xmlns: jabberData })
				.c('field', { var: 'FORM_TYPE', type: 'hidden' })
				.c('value')
				.t(Strophe.NS.MAM)
				.up()
				.up()
				.c('field', { var: withRequestedId ? 'to-id' : 'before-id' })
				.c('value')
				.t(stanzaId)
				.up()
				.up()
				.up()
				.c('set', { xmlns: Strophe.NS.RSM })
				.c('before');
			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq,
				callback: (stanza) => {
					requestHistoryCallback(stanza, queryId, undefined, true);
					resolve();
				},
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
			useStore.getState().chatsRegistry[roomId].messages,
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
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: smartMarkersCallback
		});
	}
}

export default XMPPClient;
