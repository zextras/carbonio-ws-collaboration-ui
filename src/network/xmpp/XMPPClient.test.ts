/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onGetLastActivityResponse } from './handlers/lastActivityHandler';
import { onGetRosterResponse } from './handlers/rosterHandler';
import XMPPClient from './XMPPClient';
import { XMPPRequestType } from './XMPPConnection';
import { pingStanza } from '../../tests/mocks/XMPPStanza';

describe('XMPPClient', () => {
	test('connect is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppConnect = jest.spyOn(xmppClient, 'connect');
		xmppClient.connect('token');
		expect(spyOnXmppConnect).toHaveBeenCalledWith('token');
	});

	test('getContactList is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.getContactList();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: onGetRosterResponse
		});
	});

	test('setOnline should send a presence stanza', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.setOnline();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.PRESENCE,
			elem: expect.any(Object)
		});
	});

	test('sendPong should respond to a ping request', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendPong(pingStanza('stanzaId'));

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object)
		});
	});

	test('getLastActivity is called with the correct params', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.getLastActivity('userId@carbonio');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: onGetLastActivityResponse
		});
	});

	test('sendChatMessage should send a message', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendChatMessage('roomId123', 'Hello, world!');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});

	test.todo(
		'sendChatMessage to a placeholder should create a room' /* , () => {
		mockedAddRoomRequest.mockReturnValueOnce(createMockRoom({ id: 'roomId123' }));
		const xmppClient = new XMPPClient();
		xmppClient.sendChatMessage('placeholder-roomId123', 'Hello, world!');

		expect(mockedAddRoomRequest).toBeCalled();
	} */
	);

	test('sendChatMessageReaction', () => {
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendChatMessageReaction('room-test', 'stanzaId-test', '\uD83D\uDC4D');
		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});
});
