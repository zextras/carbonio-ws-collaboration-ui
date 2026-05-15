/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Mock } from 'vitest';

import { lastActivityCallback } from './iqCallbacks/lastActivityCallback';
import { XMPPClient } from './XMPPClient';
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

let client: XMPPClient;

beforeEach(() => {
	client = new XMPPClient();
	useStore.getState().addRooms([room]);
});

describe('XMPPClient', () => {
	test('connect is called with the correct params', () => {
		const spyOnXmppConnect = vi.spyOn(client, 'connect');
		client.connect('token');
		expect(spyOnXmppConnect).toHaveBeenCalledWith('token');
	});

	test('getContactList is called with the correct params', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		(client as unknown as Record<string, () => void>).getContactList();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: expect.any(Function)
		});
	});

	test('setOnline should send a presence stanza', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		client.setOnline();

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.PRESENCE,
			elem: expect.any(Object)
		});
	});

	test('sendPong should respond to a ping request', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		client.sendPong(buildPingStanza({ pingId: 'id' }));

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object)
		});
	});

	test('getLastActivity is called with the correct params', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		client.getLastActivity('userId@carbonio');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.IQ,
			elem: expect.any(Object),
			callback: lastActivityCallback
		});
	});

	test('sendMessage should send a message', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		client.sendMessage(room.id, 'Hello, world!');

		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});

	test('sendMessage to a placeholder should create a room', () => {
		const spyOnAddRoom = vi.spyOn(api, 'replacePlaceholderRoom');
		spyOnAddRoom.mockImplementation(() => Promise.resolve(createMockRoom({ id: 'roomId123' })));
		client.sendMessage('placeholder-roomId123', 'Hello, world!');
		expect(spyOnAddRoom).toHaveBeenCalledTimes(1);
	});

	test('sendReaction should send a reaction message', () => {
		const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
		client.sendReaction(room.id, 'stanzaId-test', '👍');
		expect(spyOnXmppSend).toHaveBeenCalledWith({
			type: XMPPRequestType.MESSAGE,
			elem: expect.any(Object)
		});
	});

	describe('History methods', () => {
		test('history requests are not called for a unknown room', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			client.requestHistory('unknownId', dateToTimestamp('2024-03-12'), 10);
			client.requestMessageSubjectOfReply('unknownId', 'messageId1', 'messageId2');
			client.requestFullHistory('unknownId');
			client.requestHistoryBetweenDates('unknownId', 100, 200);
			expect(spyOnXmppSend).toHaveBeenCalledTimes(0);
		});

		test('requestHistory should start retrieve history from creation date', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			client.requestHistory(room.id, 300, 50);
			const stanza = getStanzaFromSpy(spyOnXmppSend);
			expect(findFieldValue(stanza, 'start')).toBe(room.createdAt);
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300));
		});

		test('requestHistory should start retrieve history from cleared history date', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			useStore.getState().clearConversation(room.id, dateToISODate(200));
			client.requestHistory(room.id, 300, 50);

			const clearedAt = useStore.getState().rooms[room.id].userSettings?.clearedAt;
			const stanza = getStanzaFromSpy(spyOnXmppSend);
			expect(findFieldValue(stanza, 'start')).toBe(clearedAt);
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300));
		});

		test('avoid requesting message subject of reply when message is already into store', () => {
			const message = createMockTextMessage({ roomId: room.id });
			useStore.getState().newMessage(message);
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');

			client.requestMessageSubjectOfReply(room.id, message.id, 'messageId2');
			expect(spyOnXmppSend).toHaveBeenCalledTimes(0);
		});

		test('searchMessages should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			client.searchMessages(room.id, 'test');
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'full-text-search')).toBe('test');
		});

		test('requestHistoryBetweenDates should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			client.requestHistoryBetweenDates(room.id, 200, 300);
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'start')).toBe(dateToISODate(200));
			expect(findFieldValue(stanza, 'end')).toBe(dateToISODate(300 + 1));
		});

		test('requestMessageResultHistoryToId should have correct attributes', () => {
			const spyOnXmppSend = vi.spyOn(client.xmppConnection, 'send');
			client.requestMessageResultHistoryToId(room.id, 'stanzaId-1');
			const stanza = getStanzaFromSpy(spyOnXmppSend);

			expect(findFieldValue(stanza, 'to-id')).toBe('stanzaId-1');
		});
	});
});
