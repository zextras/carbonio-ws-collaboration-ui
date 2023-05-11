/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import { textMessageRealTime } from '../network/xmpp/xmppMessageExamples';

export const xmppClient = {
	connect: (): null => null,
	getContactList: (): null => null,
	setOnline: (): null => null,
	getLastActivity: (): null => null,
	getInbox: (): null => null,
	setInbox: (): null => null,
	sendChatMessage: (): null => null,
	sendChatMessageReply: (): null => null,
	sendChatMessageDeletion: (): null => null,
	sendChatMessageEdit: (): null => null,
	requestMessageToForward: (): Promise<Element> =>
		new Promise((resolve) => {
			resolve(Strophe.createHtml(textMessageRealTime));
		}),
	requestHistory: (): null => null,
	requestHistoryBetweenTwoMessage: (): null => null,
	requestMessageSubjectOfReply: (): null => null,
	sendIsWriting: (): null => null,
	sendPaused: (): null => null,
	readMessage: (): null => null,
	lastMarkers: (): null => null
};
