/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce, forEach, size } from 'lodash';
import { Strophe } from 'strophe.js';

import { onComposingMessageStanza } from './handlers/composingMessageHandler';
import { onErrorStanza } from './handlers/errorHandler';
import { onHistoryMessageStanza } from './handlers/historyMessageHandler';
import { onInboxMessageStanza } from './handlers/inboxMessageHandler';
import { onNewMessageStanza } from './handlers/newMessageHandler';
import { onPresenceStanza } from './handlers/presenceHandler';
import { onDisplayedMessageStanza } from './handlers/smartMarkersHandler';
import useStore from '../../store/Store';
import { xmppDebug } from '../../utils/debug';

export enum XMPPRequestType {
	MESSAGE = 'MESSAGE',
	PRESENCE = 'PRESENCE',
	IQ = 'IQ'
}

export type XMPPRequest = {
	type: XMPPRequestType;
	elem: Element;
	callback?: (stanza: Element) => void;
	errorCallback?: (stanza: Element) => void;
};
class XMPPConnection {
	private token: string | undefined;

	private connection: StropheConnection;

	private connectionStatus: StropheConnectionStatus | undefined;

	private reconnectionTime = 0;

	private initFunction: VoidFunction;

	private requestsQueue: XMPPRequest[] = [];

	constructor(initFunction: VoidFunction) {
		this.initFunction = initFunction;

		// Init XMPP connection
		const service = `wss://${window.document.domain}/services/messaging/ws-xmpp`;
		this.connection = new Strophe.Connection(service);

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
		this.connection.addHandler(onPresenceStanza, null, 'presence');
		this.connection.addHandler(onNewMessageStanza, null, 'message');
		this.connection.addHandler(onHistoryMessageStanza, Strophe.NS.MAM, 'message');
		this.connection.addHandler(onInboxMessageStanza, Strophe.NS.INBOX, 'message');
		this.connection.addHandler(onComposingMessageStanza, Strophe.NS.CHAT_STATE, 'message');
		this.connection.addHandler(onDisplayedMessageStanza, Strophe.NS.MARKERS, 'message');

		this.initFunction();

		// Send all requests that were saved while XMPP was offline
		if (size(this.requestsQueue) > 0) {
			forEach(this.requestsQueue, (request) => this.send(request));
			this.requestsQueue = [];
		}
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
		const userId = useStore.getState().session.id;
		const jid = `${userId}@carbonio`;
		this.connection.connect(jid, token, this.onConnectionStatus.bind(this));
	}

	public send(request: XMPPRequest): void {
		if (this.connection && this.connectionStatus === Strophe.Status.CONNECTED) {
			switch (request.type) {
				case XMPPRequestType.MESSAGE:
					this.connection.send(request.elem);
					break;
				case XMPPRequestType.PRESENCE:
					this.connection.sendPresence(request.elem);
					break;
				case XMPPRequestType.IQ:
					this.connection.sendIQ(
						request.elem,
						request.callback,
						request.errorCallback ?? onErrorStanza
					);
					break;
				default:
					throw new Error('Unhandled request type');
			}
		} else {
			// If XMPP is offline, save request to perform it later
			this.requestsQueue.push(request);
		}
	}
}

export default XMPPConnection;
