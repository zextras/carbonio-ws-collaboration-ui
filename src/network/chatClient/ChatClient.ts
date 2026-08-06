/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import useStore from '../../store/Store';
import { wsDebug } from '../../utils/debug';
import { xmppClient } from '../xmpp/XMPPClient';

export const WSC_PURE_MIN_VERSION = '2.0.0';

/**
 * Public chat surface consumed outside the XMPP stack (UI components, WS
 * routers, boot). Mirrors the xmppClient members used at those call sites so
 * they can migrate to the SDK one API at a time without further churn.
 */
export type ChatClient = Pick<
	typeof xmppClient,
	| 'connect'
	| 'setOnline'
	| 'features'
	| 'sendChatMessage'
	| 'sendChatMessageReply'
	| 'sendChatMessageEdit'
	| 'sendChatMessageDeletion'
	| 'sendChatMessageReaction'
	| 'requestHistory'
	| 'requestFullHistory'
	| 'fullTextSearch'
	| 'requestMessageResultHistoryToId'
	| 'requestMessageToForward'
	| 'readMessage'
	| 'sendIsWriting'
	| 'sendPaused'
	| 'pinMessage'
	| 'unpinMessage'
	| 'getMessagePin'
>;

/**
 * True when the negotiated backend speaks the WSC-pure protocol (>= 2.0.0):
 * REST writes + single push WebSocket, no MongooseIM. The version gate is the
 * feature flag — against a 1.6.x backend every v2 branch is dormant.
 */
export function isWscPure(): boolean {
	const { apiVersion } = useStore.getState().session;
	return !!apiVersion && gte(apiVersion, WSC_PURE_MIN_VERSION);
}

function sdkNotWiredYet(method: string): void {
	wsDebug(`chatClient.${method}: WSC-pure backend, but the SDK path for this API is not wired yet`);
}

export const chatClient: ChatClient = {
	get features(): Array<string> {
		return xmppClient.features;
	},
	connect: (token) => {
		if (isWscPure()) {
			wsDebug('chatClient.connect: WSC-pure backend, XMPP connection skipped');
			return;
		}
		xmppClient.connect(token);
	},
	setOnline: () => {
		if (isWscPure()) {
			sdkNotWiredYet('setOnline');
			return;
		}
		xmppClient.setOnline();
	},
	sendChatMessage: (roomId, message) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendChatMessage');
			return;
		}
		xmppClient.sendChatMessage(roomId, message);
	},
	sendChatMessageReply: (roomId, message, replyTo, replyMessageId) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendChatMessageReply');
			return;
		}
		xmppClient.sendChatMessageReply(roomId, message, replyTo, replyMessageId);
	},
	sendChatMessageEdit: (roomId, message, messageStanzaId, parentStanzaId) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendChatMessageEdit');
			return;
		}
		xmppClient.sendChatMessageEdit(roomId, message, messageStanzaId, parentStanzaId);
	},
	sendChatMessageDeletion: (roomId, messageStanzaId) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendChatMessageDeletion');
			return;
		}
		xmppClient.sendChatMessageDeletion(roomId, messageStanzaId);
	},
	sendChatMessageReaction: (roomId, messageStanzaId, reaction) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendChatMessageReaction');
			return;
		}
		xmppClient.sendChatMessageReaction(roomId, messageStanzaId, reaction);
	},
	// Rest args on the methods with optional/default parameters: the façade must
	// forward the exact call arity so spies and default values behave unchanged.
	requestHistory: (...args) => {
		if (isWscPure()) {
			sdkNotWiredYet('requestHistory');
			return;
		}
		xmppClient.requestHistory(...args);
	},
	requestFullHistory: (...args) => {
		if (isWscPure()) {
			sdkNotWiredYet('requestFullHistory');
			return;
		}
		xmppClient.requestFullHistory(...args);
	},
	fullTextSearch: (roomId, text) => {
		if (isWscPure()) {
			sdkNotWiredYet('fullTextSearch');
			return Promise.resolve();
		}
		return xmppClient.fullTextSearch(roomId, text);
	},
	requestMessageResultHistoryToId: (roomId, stanzaId) => {
		if (isWscPure()) {
			sdkNotWiredYet('requestMessageResultHistoryToId');
			return Promise.resolve();
		}
		return xmppClient.requestMessageResultHistoryToId(roomId, stanzaId);
	},
	requestMessageToForward: (roomId, messageToForwardStanzaId, queryId) => {
		if (isWscPure()) {
			sdkNotWiredYet('requestMessageToForward');
			return Promise.resolve();
		}
		return xmppClient.requestMessageToForward(roomId, messageToForwardStanzaId, queryId);
	},
	readMessage: (roomId, messageId) => {
		if (isWscPure()) {
			sdkNotWiredYet('readMessage');
			return;
		}
		xmppClient.readMessage(roomId, messageId);
	},
	sendIsWriting: (roomId) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendIsWriting');
			return;
		}
		xmppClient.sendIsWriting(roomId);
	},
	sendPaused: (roomId) => {
		if (isWscPure()) {
			sdkNotWiredYet('sendPaused');
			return;
		}
		xmppClient.sendPaused(roomId);
	},
	pinMessage: (roomId, stanzaId) => {
		if (isWscPure()) {
			sdkNotWiredYet('pinMessage');
			return;
		}
		xmppClient.pinMessage(roomId, stanzaId);
	},
	unpinMessage: (roomId, stanzaId) => {
		if (isWscPure()) {
			sdkNotWiredYet('unpinMessage');
			return;
		}
		xmppClient.unpinMessage(roomId, stanzaId);
	},
	getMessagePin: (roomId) => {
		if (isWscPure()) {
			sdkNotWiredYet('getMessagePin');
			return;
		}
		xmppClient.getMessagePin(roomId);
	}
};
