/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';
import { $iq, $msg, $pres, Strophe } from 'strophe.js';
import { v4 as uuidGenerator } from 'uuid';

import { replacePlaceholderRoom } from '../apis/RoomsApi';
import { fullHistoryCallback } from './iqCallbacks/fullHistoryCallback';
import { lastActivityCallback } from './iqCallbacks/lastActivityCallback';
import { requestHistoryCallback } from './iqCallbacks/requestHistoryCallback';
import { requestHistoryWithBackfillCallback } from './iqCallbacks/requestHistoryWithBackfillCallback';
import { rosterCallback } from './iqCallbacks/rosterCallback';
import { smartMarkersCallback } from './iqCallbacks/smartMarkersCallback';
import { carbonize, carbonizeMUC, domain } from './utility/decodeJid';
import { getLastUnreadMessage } from './utility/getLastUnreadMessage';
import HistoryAccumulator from './utility/HistoryAccumulator';
import { sanitizeXmppMessage } from './utility/sanitizeXmppMessage';
import XMPPConnection, { XMPPRequestType } from './XMPPConnection';
import { getEditAndDeleteFasteningSelector } from '../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../store/Store';
import {
	FasteningAction,
	MessageFastening,
	MessageType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { dateToISODate, dateToTimestamp } from '../../utils/dateUtils';

const jabberData = 'jabber:x:data';

class XMPPClient {
	public xmppConnection: XMPPConnection;

	public features: string[] = [];

	constructor() {
		this.xmppConnection = new XMPPConnection(() => {
			this.setInbox();
			this.getContactList();
			this.setOnline();
			this.getFeatures();
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
		Strophe.addNamespace('PIN', 'zextras:iq:pin');
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
	 *
	 * Request XMPP active features.
	 */

	// Request the supported form
	public getFeatures(): void {
		const iq = $iq({ type: 'get', to: 'carbonio' }).c('query', { xmlns: Strophe.NS.DISCO_INFO });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza: Element) => {
				const featureElements = stanza.getElementsByTagName('feature');
				this.features = Array.from(featureElements).map(
					(feature) => feature.getAttribute('var') || ''
				);
			}
		});
	}

	/**
	 * INBOX:
	 * Request chat initial information like unread messages or active conversations.
	 */

	// Fetch the inbox and get initial information:
	public setInbox(): void {
		const queryId = HistoryAccumulator.getNextId();
		const iq = $iq({ type: 'set', id: queryId }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: () => {
				const inboxMessages = HistoryAccumulator.getInboxMessages(queryId);
				const filteredInbox = inboxMessages.filter((message) => {
					const inboxMessageId = useStore.getState().chatsRegistry[message.roomId]?.inboxMessageId;
					const cleanHistoryDate =
						useStore.getState().rooms[message.roomId]?.userSettings?.clearedAt;
					return (
						(!inboxMessageId || message.id !== inboxMessageId) &&
						(!cleanHistoryDate || message.date > dateToTimestamp(cleanHistoryDate))
					);
				});
				if (filteredInbox.length === 0) return;

				const { setInboxMessages, addFastening, setLastMessage } = useStore.getState();
				setInboxMessages(filteredInbox);
				const fastenings = filteredInbox.filter(
					(message) => message.type === MessageType.FASTENING
				);
				if (fastenings.length > 0) {
					addFastening(fastenings);
					Promise.all(
						fastenings.map(async (fastening) => {
							let { date } = fastening;
							while (true) {
								const queryId = HistoryAccumulator.getNextId();
								// eslint-disable-next-line no-await-in-loop
								const resp = await this.requestMessages(queryId, fastening.roomId, date, 3);
								if (!resp) return;
								const messages = HistoryAccumulator.getHistoryMessages(queryId);
								if (messages.length === 0) return;

								const fasteningMessages = messages.filter(
									(msg) => msg.type === MessageType.FASTENING
								);
								if (fasteningMessages.length > 0) {
									addFastening(fasteningMessages);
								}
								const textOrConfig = messages.findLast(
									(m) => m.type === MessageType.TEXT_MSG || m.type === MessageType.CONFIGURATION_MSG
								);

								if (textOrConfig) {
									let newLastMessage = textOrConfig;
									if (newLastMessage.type === MessageType.TEXT_MSG) {
										const lastFastening = getEditAndDeleteFasteningSelector(
											useStore.getState(),
											fastening.roomId,
											newLastMessage.stanzaId
										);
										if (lastFastening?.action === FasteningAction.EDIT) {
											newLastMessage = {
												...textOrConfig,
												edited: true,
												text: lastFastening.value ?? '',
												editedStanzaId: fastening.stanzaId
											} as TextMessage;
										}
										if (FasteningAction.DELETE === lastFastening?.action) {
											newLastMessage = {
												...textOrConfig,
												deleted: true,
												text: '',
												attachment: undefined,
												replyTo: undefined
											} as TextMessage;
										}
									}
									setLastMessage(newLastMessage.roomId, newLastMessage);
									return;
								}
								date = messages.reduce((oldest, m) => Math.min(m.date, oldest), messages[0]?.date);
							}
						})
					);
				}
			}
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
			replacePlaceholderRoom(placeholderRoom[1], message).then((response) => {
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
	sendChatMessageEdit(
		roomId: string,
		message: string,
		messageStanzaId: string,
		parentStanzaId: string
	): void {
		const uuid = uuidGenerator();
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
			.c('apply-to', {
				id: messageStanzaId,
				xmlns: Strophe.NS.XMPP_FASTEN,
				'parent-id': parentStanzaId
			})
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

	public requestMessages(
		queryId: string,
		roomId: string,
		endHistory: number,
		quantity: number
	): Promise<Element | null> {
		return new Promise((resolve, reject) => {
			if (!useStore.getState().rooms[roomId]) {
				resolve(null);
				return;
			}

			const clearedAt = useStore.getState().rooms[roomId]?.userSettings?.clearedAt;
			const startHistory = clearedAt ?? useStore.getState().rooms[roomId]?.createdAt ?? 0;

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
				.t(String(quantity))
				.up()
				.c('before');

			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq,
				callback: (stanza) => resolve(stanza),
				errorCallback: reject
			});
		});
	}

	// Request n messages before end date but not before start date
	requestHistory(roomId: string, endHistory: number, quantity = 50, unread = 0): void {
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
		const storeMessages = useStore.getState().chatsRegistry[roomId]?.messages;
		const referenceMessage = find(
			storeMessages,
			(message) => message.id === messageSubjectOfReplyId && message.type === MessageType.TEXT_MSG
		) as TextMessage;
		if (referenceMessage) {
			useStore.getState().setRepliedMessage(roomId, replyMessageId, referenceMessage);
		} else {
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
			const room = useStore.getState().rooms[roomId];
			const startSearch = room.userSettings?.clearedAt ?? room.createdAt;
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
				.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
				.c('x', { xmlns: jabberData })
				.c('field', { var: 'start' })
				.c('value')
				.t(dateToISODate(startSearch))
				.up()
				.up()
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

	requestHistoryBetweenTwoDates(roomId: string, afterDate: number, beforeDate: number): void {
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
			.c('field', { var: 'start' })
			.c('value')
			.t(dateToISODate(afterDate))
			.up()
			.up()
			.c('field', { var: 'end' })
			.c('value')
			.t(dateToISODate(beforeDate + 1));

		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza) => requestHistoryWithBackfillCallback(stanza, queryId)
		});
	}

	requestMessageResultHistoryToId(roomId: string, stanzaId: string): Promise<void> {
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
				.c('field', { var: 'to-id' })
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
					requestHistoryWithBackfillCallback(stanza, queryId);
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

	pinMessage(roomId: string, stanzaId: string): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) }).c('pin', {
			xmlns: 'urn:xmpp:pin:0',
			'message-id': stanzaId
		});
		setTimeout(() => {
			this.xmppConnection.send({
				type: XMPPRequestType.IQ,
				elem: iq
			});
		}, 500);
	}

	getMessagePin(roomId: string): void {
		if (!this.features.includes('zextras:iq:pin') && this.features.length > 0) return;

		const iq = $iq({ type: 'get', to: carbonizeMUC(roomId) }).c('pin', {
			xmlns: Strophe.NS.PIN
		});
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: (stanza: Element) => {
				const pinElement = stanza.getElementsByTagName('pin')[0];
				const stanzaId = pinElement?.getAttribute('message-id');

				if (stanzaId) {
					this.requestPinnedMessageContent(roomId, stanzaId);
				}
			}
		});
	}

	/**
	 * Fetches a message by its stanza ID and calls the callback with the result
	 */
	private fetchMessageByStanzaId(
		roomId: string,
		stanzaId: string,
		callback: (queryId: string) => void
	): void {
		const queryId = HistoryAccumulator.getNextId();
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: queryId })
			.c('x', { xmlns: jabberData })
			.c('field', { var: 'ids' })
			.c('value')
			.t(stanzaId);
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq,
			callback: () => callback(queryId)
		});
	}

	/**
	 * Handles setting the pinned message when it's an edited message (FASTENING type)
	 */
	private handleEditedPinnedMessage(roomId: string, fasteningMessage: MessageFastening): void {
		this.fetchMessageByStanzaId(roomId, fasteningMessage.originalStanzaId, (queryId) => {
			const originalMessage = HistoryAccumulator.getPinnedMessage(queryId);
			const editedMessage: TextMessage = {
				...originalMessage,
				text: fasteningMessage.value || '',
				edited: true,
				editedStanzaId: fasteningMessage.stanzaId
			} as TextMessage;
			useStore.getState().setPinnedMessage(roomId, editedMessage);
		});
	}

	requestPinnedMessageContent(roomId: string, pinnedMessageStanzaId: string): void {
		if (!useStore.getState().rooms[roomId]) return;

		const storeMessages = useStore.getState().chatsRegistry[roomId]?.messages;

		const existingMessage = find(
			storeMessages,
			(message) =>
				message.type === MessageType.TEXT_MSG && message.stanzaId === pinnedMessageStanzaId
		) as TextMessage;

		if (existingMessage) {
			useStore.getState().setPinnedMessage(roomId, existingMessage);
			return;
		}

		this.fetchMessageByStanzaId(roomId, pinnedMessageStanzaId, (queryId) => {
			const message = HistoryAccumulator.getPinnedMessage(queryId);

			if (message.type === MessageType.TEXT_MSG) {
				useStore.getState().setPinnedMessage(roomId, message);
				return;
			}

			if (message.type === MessageType.FASTENING && message.action === 'edit') {
				this.handleEditedPinnedMessage(roomId, message);
			}
		});
	}

	unpinMessage(roomId: string, stanzaId: string): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) }).c('pin', {
			xmlns: Strophe.NS.PIN,
			'message-id': stanzaId,
			action: 'delete'
		});
		this.xmppConnection.send({
			type: XMPPRequestType.IQ,
			elem: iq
		});
	}
}

export const xmppClient = new XMPPClient();
