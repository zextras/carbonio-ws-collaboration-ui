/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe, $pres, $iq, $msg, StropheConnection, StropheConnectionStatus } from 'strophe.js';
import { v4 as uuidv4 } from 'uuid';

import useStore from '../../store/Store';
import IXMPPClient from '../../types/network/xmpp/IXMPPClient';
import { dateToISODate } from '../../utils/dateUtil';
import { xmppDebug } from '../../utils/debug';
import { onComposingMessageStanza } from './handlers/composingMessageHandler';
import {
	onGetDiscoverMUCItemsResponse,
	onGetServiceDiscoveryInfoResponse,
	onGetServiceDiscoveryItemsResponse
} from './handlers/discoveryHandler';
import { onErrorStanza } from './handlers/errorHandler';
import {
	MamRequestType,
	onHistoryMessageStanza,
	onRequestHistory,
	onRequestSingleMessage
} from './handlers/historyMessageHandler';
import {
	onInboxMessageStanza,
	onGetInboxResponse,
	onSetInboxResponse
} from './handlers/inboxMessageHandler';
import { onGetLastActivityResponse } from './handlers/lastActivityHandler';
import { onNewMessageStanza } from './handlers/newMessageHandler';
import { onPresenceStanza } from './handlers/presenceHandler';
import { onGetRosterResponse } from './handlers/rosterHandler';
import { onSmartMarkers, onDisplayedMessageStanza } from './handlers/smartMarkersHandler';
import { MUCservice, carbonizeMUC } from './utility/decodeJid';

class XMPPClient implements IXMPPClient {
	private connection: StropheConnection;

	private connectionStatus: StropheConnectionStatus | undefined;

	constructor() {
		// Init XMPP connection
		const service = `wss://${window.document.domain}/services/messaging/ws-xmpp`;
		this.connection = new Strophe.Connection(service);

		// Useful namespaces
		Strophe.addNamespace('ROSTER', 'jabber:iq:roster');
		Strophe.addNamespace('LAST_ACTIVITY', 'jabber:iq:last');
		Strophe.addNamespace('INBOX', 'erlang-solutions.com:xmpp:inbox:0');
		Strophe.addNamespace('DISCO_ITEMS', 'http://jabber.org/protocol/disco#items');
		Strophe.addNamespace('DISCO_INFO', 'http://jabber.org/protocol/disco#info');
		Strophe.addNamespace('MAM', 'urn:xmpp:mam:2');
		Strophe.addNamespace('AFFILIATIONS', 'urn:xmpp:muclight:0#affiliations');
		Strophe.addNamespace('CONFIGURATION', 'urn:xmpp:muclight:0#configuration');
		Strophe.addNamespace('CHAT_STATE', 'http://jabber.org/protocol/chatstates');
		Strophe.addNamespace('MARKERS', 'urn:xmpp:chat-markers:0');
		Strophe.addNamespace('SMART_MARKERS', 'esl:xmpp:smart-markers:0');
		Strophe.addNamespace('XMLNS_XMPP_RETRACT', 'urn:xmpp:message-retract:0');
		Strophe.addNamespace('XMLNS_XMPP_FALLBACK', 'urn:xmpp:fallback:0');

		// Handler for event stanzas
		this.connection.addHandler(onPresenceStanza.bind(this), null, 'presence');
		this.connection.addHandler(onNewMessageStanza.bind(this), null, 'message');
		this.connection.addHandler(onHistoryMessageStanza, Strophe.NS.MAM, 'message');
		this.connection.addHandler(onInboxMessageStanza.bind(this), Strophe.NS.INBOX, 'message');
		// Handler used for writing status writitng/stopped
		this.connection.addHandler(onComposingMessageStanza, Strophe.NS.CHAT_STATE, 'message');
		this.connection.addHandler(onDisplayedMessageStanza, Strophe.NS.MARKERS, 'message');

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
				this.connectionEstablish();
				setXmppStatus(true);
				break;
			}
			case Strophe.Status.DISCONNECTED: {
				xmppDebug('Disconnected!');
				setXmppStatus(false);
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

	public connect(token: string): void {
		const store = useStore.getState();
		const jid = `${store.session.id}@carbonio`;
		if (this.connectionStatus !== Strophe.Status.CONNECTING) {
			this.connection.connect(jid, token, this.onConnectionStatus.bind(this));
		}
	}

	private connectionEstablish(): void {
		// Receive list of my subscription
		this.getContactList();
		// Send my presence and start receiving others
		this.setOnline();

		this.setInbox();
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
		const iq = $iq({ type: 'get' }).c('query', { xmlns: Strophe.NS.ROSTER });
		this.connection.sendIQ(iq, onGetRosterResponse.bind(this), onErrorStanza);
	}

	// Send my 'presence' event to all my contacts
	public setOnline(): void {
		this.connection.send($pres());
	}

	// Request last activity date of a particular user
	public getLastActivity(jid: string): void {
		const iq = $iq({ type: 'get', to: jid }).c('query', { xmlns: Strophe.NS.LAST_ACTIVITY });
		this.connection.sendIQ(iq, onGetLastActivityResponse, onErrorStanza);
	}

	// Add a user to my contact list
	// TODO: remove because it is done automatically by server
	public addContactItem(jid: string, name?: string): void {
		const iq = $iq({ type: 'set' })
			.c('query', { xmlns: Strophe.NS.ROSTER })
			.c('item', { jid, name });
		this.connection.sendIQ(iq, (resp: any) => console.log('Add contact', resp), onErrorStanza);
	}

	// Remove a user to my contact list
	// TODO: remove because it is done automatically by server
	public removeContactItem(jid: string): void {
		const iq = $iq({ type: 'set' })
			.c('query', { xmlns: Strophe.NS.ROSTER })
			.c('item', { jid, subscription: 'remove' });
		this.connection.sendIQ(iq, (resp: any) => console.log('Remove contact', resp), onErrorStanza);
	}

	// Subscribe to a user to receive his 'presence' events
	// TODO: remove because it is done automatically by server
	public sendPresenceSubscription(jid: string): void {
		this.connection.send($pres({ to: jid, type: 'subscribe' }));
	}

	// Let a user to subscribe to my 'presence' events
	// TODO: remove because it is done automatically by server
	public sendPresenceSubscribed(jid: string): void {
		this.connection.send($pres({ to: jid, type: 'subscribed' }));
	}

	/**
	 * DISCOVERY:
	 * Useful only for initial project development.
	 * Useless for chat flow
	 */

	public serviceDiscoveryItems(): void {
		const iq = $iq({ type: 'get' }).c('query', { xmlns: Strophe.NS.DISCO_ITEMS });
		this.connection.sendIQ(iq, onGetServiceDiscoveryItemsResponse, onErrorStanza);
	}

	public serviceDiscoveryInfo(): void {
		const iq = $iq({ type: 'get', to: MUCservice }).c('query', { xmlns: Strophe.NS.DISCO_INFO });
		this.connection.sendIQ(iq, onGetServiceDiscoveryInfoResponse, onErrorStanza);
	}

	public discoverMUCItems(): void {
		const iq = $iq({ type: 'get', to: MUCservice }).c('query', { xmlns: Strophe.NS.DISCO_ITEMS });
		this.connection.sendIQ(iq, onGetDiscoverMUCItemsResponse, onErrorStanza);
	}

	/**
	 * INBOX:
	 * Request chat initial information like unread messages or active conversations.
	 */

	// Request the supported form
	public getInbox(): void {
		const iq = $iq({ type: 'get' }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.connection.sendIQ(iq, onGetInboxResponse, onErrorStanza);
	}

	// Fetch the inbox and get initial information:
	public setInbox(): void {
		const iq = $iq({ type: 'set' }).c('inbox', { xmlns: Strophe.NS.INBOX });
		this.connection.sendIQ(iq, onSetInboxResponse, onErrorStanza);
	}

	/**
	 * MESSAGE:
	 * Control message flow sending messages and request history
	 */

	// Send a text message
	sendChatMessage(roomId: string, message: string, replyTo?: string): void {
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuidv4() })
			.c('body')
			.t(message)
			.up()
			.c('markable', { xmlns: Strophe.NS.MARKERS });
		if (replyTo != null) {
			msg.up().c('thread').t(replyTo);
		}
		this.connection.send(msg);
	}

	/**
	 * Delete a message / Message Retraction (XEP-0424)
	 * Documentation: https://xmpp.org/extensions/xep-0424.html#schema
	 */
	sendChatMessageDeletion(roomId: string, messageId: string): void {
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat', id: uuidv4() })
			.c('apply-to', { id: messageId, xmlns: 'urn:xmpp:fasten:0' })
			.c('retract', { xmlns: Strophe.NS.XMLNS_XMPP_RETRACT });
		this.connection.send(msg);
	}

	// Request the full history of a room
	// TODO: remove, useless
	requestFullHistory(roomId: string): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) }).c('query', { xmlns: Strophe.NS.MAM });
		this.connection.sendIQ(iq, onRequestHistory.bind(this), onErrorStanza);
	}

	// Request n messages before end date but not before start date
	requestHistory(roomId: string, endHistory: number, quantity = 5): void {
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
		this.connection.sendIQ(iq, onRequestHistory.bind(this), onErrorStanza);
	}

	requestHistoryBetweenTwoMessage(
		roomId: string,
		olderMessageId: string,
		newerMessageId: string
	): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM })
			.c('x', { xmlns: 'jabber:x:data' })
			.c('field', { var: 'from_id' })
			.c('value')
			.t(olderMessageId)
			.up()
			.up()
			.c('field', { var: 'to_id' })
			.c('value')
			.t(newerMessageId);
		this.connection.sendIQ(iq, onRequestHistory.bind(this), onErrorStanza);
	}

	requestRepliedMessage(roomId: string, originalMessageId: string, repliedMessageId: string): void {
		const iq = $iq({ type: 'set', to: carbonizeMUC(roomId) })
			.c('query', { xmlns: Strophe.NS.MAM, queryid: MamRequestType.REPLIED })
			.c('x', { xmlns: 'jabber:x:data' })
			.c('field', { var: 'from_id' })
			.c('value')
			.t(repliedMessageId)
			.up()
			.up()
			.c('field', { var: 'to_id' })
			.c('value')
			.t(repliedMessageId);
		this.connection.sendIQ(
			iq,
			(stanza) => onRequestSingleMessage(originalMessageId, stanza),
			onErrorStanza
		);
	}

	/**
	 * CHAT STATE:
	 * Control 'isWriting' information by sending 'composing' or 'paused' events.
	 */

	// Send "I'm typing" information to all the users on the room
	sendIsWriting(roomId: string): void {
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('composing', {
			xmlns: Strophe.NS.CHAT_STATE
		});
		this.connection.send(msg);
	}

	// Sending a paused event to all users on the room
	sendPaused(roomId: string): void {
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('paused', {
			xmlns: Strophe.NS.CHAT_STATE
		});
		this.connection.send(msg);
	}

	/**
	 * MARKERS
	 * Functions to control the read / unread state of a message
	 */

	// Send confirmation that I read a certain message
	readMessage(roomId: string, messageId: string): void {
		const msg = $msg({ to: carbonizeMUC(roomId), type: 'groupchat' }).c('displayed', {
			xmlns: Strophe.NS.MARKERS,
			id: messageId
		});
		this.connection.send(msg);
	}

	// Request last message read date of all the members of a room
	lastMarkers(roomId: string): void {
		const iq = $iq({ type: 'get' }).c('query', {
			xmlns: Strophe.NS.SMART_MARKERS,
			peer: carbonizeMUC(roomId)
		});
		this.connection.sendIQ(iq, onSmartMarkers, onErrorStanza);
	}
}

export default XMPPClient;
