/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Mock } from 'vitest';

import { lastActivityCallback } from './iqCallbacks/lastActivityCallback';
import { rosterCallback } from './iqCallbacks/rosterCallback';
import { xmppClient } from './XMPPClient';
import { XMPPRequestType } from './XMPPConnection';
import useStore from '../../store/Store';
import { buildPingStanza } from '../../tests/buildXmppStanza';
import { createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { dateToISODate, dateToTimestamp } from '../../utils/dateUtils';
import * as api from '../apis/RoomsApi';

const getStanzaFromSpy = (spy: Mock, callIndex = 0): Element =>
	spy.mock.calls[callIndex][0].elem.tree();

const findFieldValue = (stanza: Element, fieldVar: string): string | null => {
	const field = Array.from(stanza.querySelectorAll('field')).find(
		(f) => f.getAttribute('var') === fieldVar
	);
	return field?.querySelector('value')?.textContent || null;
};

const room = createMockRoom({
	id: 'room-test',
	createdAt: dateToISODate(100)
});

beforeEach(() => {
	useStore.getState().addRooms([room]);
});
describe('XMPPClient', () => {
	test('connect is called with the correct params', () => {
		const spyOnXmppConnect = vi.spyOn(xmppClient, 'connect');
		xmppClient.connect('token');
		expect(spyOnXmppConnect).toHaveBeenCalledWith('token');
	});

	test('getContactList is called with the correct params', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.getContactList();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: rosterCallback
		});
	});

	test('setOnline should send a presence stanza', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.setOnline();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.PRESENCE,
			elem: expect.any(Object)
		});
	});

	test('sendPong should respond to a ping request', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendPong(buildPingStanza({ pingId: 'id' }));

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object)
		});
	});

	test('getLastActivity is called with the correct params', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.getLastActivity('userId@carbonio');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: lastActivityCallback
		});
	});

	test('sendChatMessage should send a message', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendChatMessage(room.id, 'Hello, world!');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});

	test('sendChatMessage to a placeholder should create a room', () => {
		const spyOnAddRoom = vi.spyOn(api, 'replacePlaceholderRoom');
		spyOnAddRoom.mockImplementation(() => Promise.resolve(createMockRoom({ id: 'roomId123' })));
		xmppClient.sendChatMessage('placeholder-roomId123', 'Hello, world!');
		expect(spyOnAddRoom).toHaveBeenCalledTimes(1);
	});

	test('sendChatMessageReaction', () => {
		const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
		xmppClient.sendChatMessageReaction(room.id, 'stanzaId-test', '\uD83D\uDC4D');
		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});

	describe('History methods', () => {
		test('history requests are not called for a unknown room', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			xmppClient.requestHistory('unknownId', dateToTimestamp('2024-03-12'), 10);
			xmppClient.requestMessageSubjectOfReply('unknownId', 'messageId1', 'messageId2');
			xmppClient.requestFullHistory('unknownId');
			xmppClient.requestHistoryBetweenTwoDates('unknownId', 100, 200);
			expect(spyOnXmppSend).toHaveBeenCalledTimes(0);
		});

		test('requestHistory should start retrieve history from creation date', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			xmppClient.requestHistory(room.id, 300, 50);
			const stanza = getStanzaFromSpy(spyOnXmppSend);
			expect(findFieldValue(stanza, 'start')).toBe(room.createdAt);
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300));
		});

		test('requestHistory should start retrieve history from cleared history date', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			useStore.getState().clearConversation(room.id, dateToISODate(200));
			xmppClient.requestHistory(room.id, 300, 50);

			const clearedAt = useStore.getState().rooms[room.id].userSettings?.clearedAt;
			const stanza = getStanzaFromSpy(spyOnXmppSend);
			expect(findFieldValue(stanza, 'start')).toBe(clearedAt);
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300));
		});

		test('avoid requesting message subject of reply when message is already into store', () => {
			const message = createMockTextMessage({ roomId: room.id });
			useStore.getState().newMessage(message);
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');

			xmppClient.requestMessageSubjectOfReply(room.id, message.id, 'messageId2');
			expect(spyOnXmppSend).toHaveBeenCalledTimes(0);
		});

		test('fullTextSearch should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			xmppClient.fullTextSearch(room.id, 'test');
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'full-text-search')).toBe('test');
		});

		test('requestHistoryBetweenTwoDates should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			xmppClient.requestHistoryBetweenTwoDates(room.id, 200, 300);
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'start')).toBe(dateToISODate(200));
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300 + 1));
		});

		test('requestMessageResultHistoryToId should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(xmppClient.xmppConnection, 'send');
			xmppClient.requestMessageResultHistoryToId(room.id, 'stanzaId-1');
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'to-id')).toBe('stanzaId-1');
		});
	});
});
