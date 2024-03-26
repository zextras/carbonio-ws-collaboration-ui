/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import { textMessageRealTime } from '../network/xmpp/xmppMessageExamples';

export const mockedSendChatMessage = jest.fn();
export const mockedSendChatMessageEdit = jest.fn();
export const mockedSendChatMessageReply = jest.fn();
export const mockedSendIsWriting = jest.fn();
export const mockedSendPaused = jest.fn();

export const mockedReadMessage = jest.fn();
export const xmppClient = {
	connect: (): null => null,
	getContactList: (): null => null,
	setOnline: (): null => null,
	getLastActivity: (): null => null,
	getInbox: (): null => null,
	setInbox: (): null => null,
	sendChatMessage: mockedSendChatMessage,
	sendChatMessageReply: mockedSendChatMessageReply,
	sendChatMessageDeletion: (): null => null,
	sendChatMessageEdit: mockedSendChatMessageEdit,
	requestMessageToForward: (): Promise<Element> =>
		new Promise((resolve) => {
			resolve(Strophe.createHtml(textMessageRealTime));
		}),
	requestHistory: (): null => null,
	requestHistoryBetweenTwoMessage: (): null => null,
	requestMessageSubjectOfReply: (): null => null,
	sendIsWriting: mockedSendIsWriting,
	sendPaused: mockedSendPaused,
	readMessage: mockedReadMessage,
	lastMarkers: (): null => null
};
