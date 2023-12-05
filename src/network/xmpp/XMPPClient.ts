/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce, find, forEach } from 'lodash';
import { $iq, $msg, $pres, Strophe } from 'strophe.js';
import { v4 as uuidGenerator } from 'uuid';

import { onComposingMessageStanza } from './handlers/composingMessageHandler';
import { onErrorStanza } from './handlers/errorHandler';
import {
	MamRequestType,
	onHistoryMessageStanza,
	onRequestHistory,
	onRequestSingleMessage
} from './handlers/historyMessageHandler';
import {
	onGetInboxResponse,
	onInboxMessageStanza,
	onSetInboxResponse
} from './handlers/inboxMessageHandler';
import { onGetLastActivityResponse } from './handlers/lastActivityHandler';
import { onNewMessageStanza } from './handlers/newMessageHandler';
import { onPresenceStanza } from './handlers/presenceHandler';
import { onGetRosterResponse } from './handlers/rosterHandler';
import { onDisplayedMessageStanza, onSmartMarkers } from './handlers/smartMarkersHandler';
import { carbonize, carbonizeMUC } from './utility/decodeJid';
import useStore from '../../store/Store';
import IXMPPClient from '../../types/network/xmpp/IXMPPClient';
import { dateToISODate } from '../../utils/dateUtil';
import { xmppDebug } from '../../utils/debug';

const jabberData = 'jabber:x:data';

class XMPPClient implements IXMPPClient {
	private connection: StropheConnection;

	private connectionStatus: StropheConnectionStatus | undefined;

	private token: string | undefined;

	private reconnectionTime = 0;

	private requestsQueue: RequestType[] = [];

	constructor() {
		// Init XMPP connection
		const service = `wss://${window.document.domain}/services/messaging/ws-xmpp`;
		this.connection = new Strophe.Connection(service);

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

		// Debug
		// const parser = new DOMParser();
		// this.connection.rawInput = (data: string): void => {
		// 	xmppDebug('<-- IN:', parser.parseFromString(data, 'text/xml'));
		// };
		// this.connection.rawOutput = (data: string): void => {
		// 	xmppDebug('---> OUT:', parser.parseFromString(data, 'text/xml'));
		// };
	}

	private onConnectionStatus(statusCode: StropheConnectionStatus): void {
		const { setXmppStatus } = useStore.getState();
		this.connectionStatus = statusCode;
		switch (statusCode) {
			case Strophe.Status.ERROR: {
				xmppDebug('Connection error');
				setXmppStatus(false);
				break;
			}
			case Strophe.Status.CONNECTING: {
				xmppDebug('Connecting...');
				break;
			}
			case Strophe.Status.CONNFAIL: {
				xmppDebug('Connection failed!');
				setXmppStatus(false);
				break;
			}
			case Strophe.Status.AUTHENTICATING: {
				xmppDebug('Authenticating...');
				break;
			}
			case Strophe.Status.AUTHFAIL: {
				xmppDebug('Authentication failed!');
				setXmppStatus(false);
				break;
			}
			case Strophe.Status.CONNECTED: {
				xmppDebug('Connected!');
				setXmppStatus(true);
				this.connectionEstablish();
				break;
			}
			case Strophe.Status.DISCONNECTED: {
				xmppDebug('Disconnected!');
				setXmppStatus(false);
				this.tryReconnection();
				break;
			}
			case Strophe.Status.DISCONNECTING: {
				xmppDebug('Disconnecting...');
				break;
			}
			case Strophe.Status.ATTACHED: {
				xmppDebug('The connection has been attached');
				break;
			}
			case Strophe.Status.REDIRECT: {
				xmppDebug('The connection has been redirected');
				break;
			}
			case Strophe.Status.CONNTIMEOUT: {
				xmppDebug('Connection timeout');
				break;
			}
			default:
				xmppDebug('Unhandled xmpp status');
		}
	}

	private connectionEstablish(): void {
		// In case of reconnection, reset XMPP data to let the client knows that it has to re-request everything
		if (this.reconnectionTime > 0) {
			useStore.getState().resetXmppData();
			this.reconnectionTime = 0;
		}

		// Register handlers for event stanzas on every connection
		this.connection.addHandler(onPresenceStanza.bind(this), null, 'presence');
		this.connection.addHandler(onNewMessageStanza.bind(this), null, 'message');
		this.connection.addHandler(onHistoryMessageStanza, Strophe.NS.MAM, 'message');
		this.connection.addHandler(onInboxMessageStanza.bind(this), Strophe.NS.INBOX, 'message');
		this.connection.addHandler(onComposingMessageStanza, Strophe.NS.CHAT_STATE, 'message');
		this.connection.addHandler(onDisplayedMessageStanza, Strophe.NS.MARKERS, 'message');

		// Receive list of my subscription
		this.getContactList();
		// Send my presence and start receiving others
		this.setOnline();
		// Request inbox data: last message of every chat and unread messages count
		this.setInbox();
		// Send history queued requests
		forEach(this.requestsQueue, ({ iq, callback }) => this.connection.sendIQ(iq, callback));
		this.requestsQueue = [];
	}

	private tryReconnection = debounce(() => {
		xmppDebug(`Try reconnection in: ${this.reconnectionTime}`);
		setTimeout(() => {
			if (this.token && this.connectionStatus !== Strophe.Status.CONNECTING) {
				this.connect(this.token);
			}
		}, this.reconnectionTime);
		this.reconnectionTime = this.reconnectionTime * 2 + 1000;
	}, 200);

	public connect(token: string): void {
		this.token = token;
		const store = useStore.getState();
		const jid = `${store.session.id}@carbonio`;
		this.connection.connect(jid, token, this.onConnectionStatus.bind(this));
	}

	/**
	 * PRESENCE:
	 * I receive presence events only from users who are on my contact list with a bidirectional subscription.
	 * Automatically, when one_to_one conversation with a certain user starts, this user is added to my contact list,
	 * I'm subscribed to his changes and he is subscribed to my changes.
	 * For offline contact, request last activity.
	 */

	// Request my contact list
	public getContactList(): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'get' }).c('query', { xmlns: Strophe.NS.ROSTER });
			this.connection.sendIQ(iq, onGetRosterResponse.bind(this), onErrorStanza);
		}
	}

	// Send my 'presence' event to all my contacts
	public setOnline(): void {
		if (this.connection && this.connection.connected) {
			this.connection.send($pres());
		}
	}

	// Request last activity date of a particular user
	public getLastActivity(jid: string): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'get', to: jid }).c('query', { xmlns: Strophe.NS.LAST_ACTIVITY });
			this.connection.sendIQ(iq, onGetLastActivityResponse, onErrorStanza);
		}
	}

	/**
	 * INBOX:
	 * Request chat initial information like unread messages or active conversations.
	 */

	// Request the supported form
	public getInbox(): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'get' }).c('inbox', { xmlns: Strophe.NS.INBOX });
			this.connection.sendIQ(iq, onGetInboxResponse, onErrorStanza);
		}
	}

	// Fetch the inbox and get initial information:
	public setInbox(): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'set' }).c('inbox', { xmlns: Strophe.NS.INBOX });
			this.connection.sendIQ(iq, onSetInboxResponse, onErrorStanza);
		}
	}

	/**
	 * MESSAGE:
	 * Control message flow sending messages and request history
	 */

	// Send a text message
	sendChatMessage(roomId: string, message: string): void {
		if (this.connection && this.connection.connected) {
			const uuid = uuidGenerator();
			// Set a placeholder message into the store
			useStore.getState().setPlaceholderMessage({ roomId, id: uuid, text: message });

			// Send the message to xmpp server
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
				.c('body')
				.t(message)
				.up()
				.c('markable', { xmlns: Strophe.NS.MARKERS });
			this.connection.send(msg);
		}
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
		if (this.connection && this.connection.connected) {
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
			this.connection.send(msg);
		}
	}

	/**
	 * Delete a message / Message Retraction (XEP-0424)
	 * Documentation: https://esl.github.io/MongooseDocs/latest/modules/mod_mam/#retraction-on-the-stanza-id
	 */
	sendChatMessageDeletion(roomId: string, messageStanzaId: string): void {
		if (this.connection && this.connection.connected) {
			const uuid = uuidGenerator();
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuid })
				.c('apply-to', { id: messageStanzaId, xmlns: Strophe.NS.XMPP_FASTEN })
				.c('retract', { xmlns: Strophe.NS.XMPP_RETRACT });
			this.connection.send(msg);
		}
	}

	/**
	 * Edit a message using Message Fastening
	 * Documentation: https://xmpp.org/extensions/xep-0422.html
	 */
	sendChatMessageEdit(roomId: string, message: string, messageStanzaId: string): void {
		if (this.connection && this.connection.connected) {
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
			this.connection.send(msg);
		}
	}

	// Request the full history of a room
	requestFullHistory(roomId: string): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) }).c('query', {
				xmlns: Strophe.NS.MAM
			});
			this.connection.sendIQ(iq, onRequestHistory.bind(this, undefined), onErrorStanza);
		}
	}

	// Request n messages before end date but not before start date
	requestHistory(roomId: string, endHistory: number, quantity: number, unread?: number): void {
		const clearedAt = useStore.getState().rooms[roomId].userSettings?.clearedAt;
		const startHistory = clearedAt || useStore.getState().rooms[roomId].createdAt;
		// Ask for ${QUANTITY} messages before end date but not before start date
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: MamRequestType.HISTORY })
			.c('x', { type: 'submit' })
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
		if (this.connection && this.connection.connected) {
			this.connection.sendIQ(iq, onRequestHistory.bind(this, unread), onErrorStanza);
		} else if (!find(this.requestsQueue, (request) => request.roomId === roomId)) {
			// If XMPP is offline, save request to perform it later
			this.requestsQueue.push({ iq, callback: onRequestHistory.bind(this, unread), roomId });
		}
	}

	requestHistoryBetweenTwoMessage(
		roomId: string,
		olderMessageId: string,
		newerMessageId: string
	): void {
		if (this.connection && this.connection.connected) {
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
			this.connection.sendIQ(iq, onRequestHistory.bind(this, undefined), onErrorStanza);
		}
	}

	requestMessageSubjectOfReply(
		roomId: string,
		messageSubjectOfReplyId: string,
		replyMessageId: string
	): void {
		if (this.connection && this.connection.connected) {
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
			this.connection.sendIQ(
				iq,
				(stanza) => onRequestSingleMessage(replyMessageId, stanza),
				onErrorStanza
			);
		}
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
			this.connection.sendIQ(iq, resolve, (stanzaError) => {
				onErrorStanza(stanzaError);
				reject(stanzaError);
			});
		});
	}

	/**
	 * CHAT STATE:
	 * Control 'isWriting' information by sending 'composing' or 'paused' events.
	 */

	// Send "I'm typing" information to all the users on the room
	sendIsWriting(roomId: string): void {
		if (this.connection && this.connection.connected) {
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('composing', {
				xmlns: Strophe.NS.CHAT_STATE
			});
			this.connection.send(msg);
		}
	}

	// Sending a paused event to all users on the room
	sendPaused(roomId: string): void {
		if (this.connection && this.connection.connected) {
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('paused', {
				xmlns: Strophe.NS.CHAT_STATE
			});
			this.connection.send(msg);
		}
	}

	/**
	 * MARKERS
	 * Functions to control the read / unread state of a message
	 */

	// Send confirmation that I read a certain message
	readMessage(roomId: string, messageId: string): void {
		if (this.connection && this.connection.connected) {
			const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('displayed', {
				xmlns: Strophe.NS.MARKERS,
				id: messageId
			});
			this.connection.send(msg);
		}
	}

	// Request last message read date of all the members of a room
	lastMarkers(roomId: string): void {
		if (this.connection && this.connection.connected) {
			const iq = $iq({ type: 'get' }).c('query', {
				xmlns: Strophe.NS.SMART_MARKERS,
				peer: carbonizeMUC(roomId)
			});
			this.connection.sendIQ(iq, onSmartMarkers, onErrorStanza);
		}
	}
}

export default XMPPClient;

type RequestType = {
	iq: Element;
	callback: (stanza: Element) => void;
	roomId: string;
};
