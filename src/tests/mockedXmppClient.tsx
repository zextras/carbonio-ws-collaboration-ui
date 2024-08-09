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
export const mockedRequestFullHistory = jest.fn();
export const mockedSendIsWriting = jest.fn();
export const mockedSendPaused = jest.fn();
export const mockedReadMessage = jest.fn();
export const mockedSendChatMessageDeletion = jest.fn();

export const xmppClient = {
	connect: jest.fn(),
	getContactList: jest.fn(),
	setOnline: jest.fn(),
	sendPong: jest.fn(),
	getLastActivity: jest.fn(),
	getInbox: jest.fn(),
	setInbox: jest.fn(),
	sendChatMessage: mockedSendChatMessage,
	sendChatMessageReply: mockedSendChatMessageReply,
	sendChatMessageDeletion: mockedSendChatMessageDeletion,
	sendChatMessageEdit: mockedSendChatMessageEdit,
	sendChatMessageReaction: jest.fn(),
	requestMessageToForward: (): Promise<Element> =>
		Promise.resolve(Strophe.createHtml(textMessageRealTime)),
	requestHistory: jest.fn(),
	requestHistoryBetweenTwoMessage: jest.fn(),
	requestMessageSubjectOfReply: jest.fn(),
	requestFullHistory: mockedRequestFullHistory,
	sendIsWriting: mockedSendIsWriting,
	sendPaused: mockedSendPaused,
	readMessage: mockedReadMessage,
	lastMarkers: jest.fn()
};
