/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lastActivityCallback } from './iqCallbacks/lastActivityCallback';
import { rosterCallback } from './iqCallbacks/rosterCallback';
import XMPPClient from './XMPPClient';
import { XMPPRequestType } from './XMPPConnection';
import useStore from '../../store/Store';
import { createMockRoom } from '../../tests/createMock';
import { buildPingStanza } from '../../tests/mocks/buildXmppStanza';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../tests/mocks/network';
import { dateToTimestamp } from '../../utils/dateUtils';

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
			callback: rosterCallback
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
		xmppClient.sendPong(buildPingStanza({ pingId: 'id' }));

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
			callback: lastActivityCallback
		});
	});

	test('requestHistory is called for a known room', () => {
		const room = createMockRoom({ id: 'room-test' });
		useStore.getState().addRooms([createMockRoom({ id: room.id })]);
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.requestHistory(room.id, dateToTimestamp('2024-03-12'), 10);
		xmppClient.requestMessageSubjectOfReply(room.id, 'messageId1', 'messageId2');
		xmppClient.requestFullHistory(room.id);

		expect(spyOnXmppSend).toHaveBeenCalledTimes(3);
	});

	test('requestHistory is not called for an unknown room', () => {
		const room = createMockRoom({ id: 'room-test' });
		const xmppClient = new XMPPClient();
		const spyOnXmppSend = jest.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.requestHistory(room.id, dateToTimestamp('2024-03-12'), 10);
		xmppClient.requestMessageSubjectOfReply(room.id, 'messageId1', 'messageId2');
		xmppClient.requestFullHistory(room.id);

		expect(spyOnXmppSend).toHaveBeenCalledTimes(0);
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

	test('sendChatMessage to a placeholder should create a room', () => {
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		spyOnAddRoom.mockImplementation(() => Promise.resolve(createMockRoom({ id: 'roomId123' })));
		const xmppClient = new XMPPClient();
		xmppClient.sendChatMessage('placeholder-roomId123', 'Hello, world!');
		expect(spyOnAddRoom).toHaveBeenCalledTimes(1);
	});

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
