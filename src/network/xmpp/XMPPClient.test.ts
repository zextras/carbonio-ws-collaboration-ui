/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onGetLastActivityResponse } from './handlers/lastActivityHandler';
import { onGetRosterResponse } from './handlers/rosterHandler';
import XMPPClient from './XMPPClient';
import { XMPPRequestType } from './XMPPConnection';
import { mockedXmppConnect, mockedXmppSend } from '../../../jest-mocks';

describe('XMPPClient', () => {
	test('connect is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		xmppClient.connect('token');
		expect(mockedXmppConnect).toHaveBeenCalledWith('token');
	});

	test('getContactList is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		xmppClient.getContactList();

		expect(mockedXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: onGetRosterResponse
		});
	});

	test('setOnline should send a presence stanza', () => {
		const xmppClient = new XMPPClient();
		xmppClient.setOnline();

		expect(mockedXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.PRESENCE,
			elem: expect.any(Object)
		});
	});

	test('getLastActivity is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		xmppClient.getLastActivity('userId@carbonio');

		expect(mockedXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: onGetLastActivityResponse
		});
	});

	test('sendChatMessage should send a message', () => {
		const xmppClient = new XMPPClient();
		xmppClient.sendChatMessage('roomId123', 'Hello, world!');

		expect(mockedXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});
});