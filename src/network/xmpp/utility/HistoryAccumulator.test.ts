/* eslint-disable jest-dom/prefer-to-have-text-content */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import HistoryAccumulator from './HistoryAccumulator';
import { buildTextMessageFromHistory } from '../../../tests/buildXmppStanza';
import { TextMessage } from '../../../types/store/ChatsRegistryTypes';

describe('HistoryAccumulator', () => {
	test('Push and get elements based on queryId', () => {
		const queryId1 = HistoryAccumulator.getNextId();
		const queryId2 = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(queryId1, buildTextMessageFromHistory({ text: 'message1' }));
		HistoryAccumulator.pushToCache(queryId2, buildTextMessageFromHistory({ text: 'message2' }));
		HistoryAccumulator.pushToCache(queryId1, buildTextMessageFromHistory({ text: 'message3' }));

		const cached1 = HistoryAccumulator.getCachedElements(queryId1) as Element[];
		expect(cached1.length).toBe(2);
		expect(cached1[0].getElementsByTagName('body')[0].textContent).toBe('message1');
		expect(cached1[1].getElementsByTagName('body')[0].textContent).toBe('message3');

		const cached2 = HistoryAccumulator.getCachedElements(queryId2) as Element[];
		expect(cached2.length).toBe(1);
		expect(cached2[0].getElementsByTagName('body')[0].textContent).toBe('message2');
	});

	test('getForwardedMessage retrieve a single XMPP message', () => {
		const queryId = HistoryAccumulator.getNextId();
		const textMessage = buildTextMessageFromHistory({
			text: 'forwarded message',
			stanzaId: 'stanza123',
			timestamp: '2024-01-01T12:00:00Z'
		});
		HistoryAccumulator.pushToCache(queryId, textMessage);

		const forwardedMessage = HistoryAccumulator.getForwardedMessage(queryId);
		expect(forwardedMessage).toBeDefined();
		expect(forwardedMessage.getElementsByTagName('result')).toHaveLength(0);
		expect(forwardedMessage.getElementsByTagName('body')[0].textContent).toBe('forwarded message');
	});

	test('getForwardedMessage throws error if multiple cached elements exist', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(queryId, buildTextMessageFromHistory({ text: 'message1' }));
		HistoryAccumulator.pushToCache(queryId, buildTextMessageFromHistory({ text: 'message2' }));
		expect(() => {
			HistoryAccumulator.getForwardedMessage(queryId);
		}).toThrow('There should be exactly one cached element for forwarded messages');
	});

	test('getSearchedMessages retrieves and decodes messages correctly', () => {
		const queryId = HistoryAccumulator.getNextId();
		const textMessage1 = buildTextMessageFromHistory({
			text: 'searched message 1',
			stanzaId: 'stanza1',
			timestamp: '2024-01-01T12:00:00Z'
		});
		const textMessage2 = buildTextMessageFromHistory({
			text: 'searched message 2',
			stanzaId: 'stanza2',
			timestamp: '2024-02-02T12:00:00Z'
		});
		HistoryAccumulator.pushToCache(queryId, textMessage1);
		HistoryAccumulator.pushToCache(queryId, textMessage2);

		const searchedMessages = HistoryAccumulator.getSearchedMessages(queryId);
		expect(searchedMessages.length).toBe(2);

		const oldestMessage = searchedMessages[1] as TextMessage;
		expect(oldestMessage.text).toBe('searched message 1');
		expect(oldestMessage.stanzaId).toBe('stanza1');
		expect(new Date(oldestMessage.date).toISOString()).toBe('2024-01-01T12:00:00.000Z');
	});

	test('getRepliedMessage retrieves a single decoded message', () => {
		const queryId = HistoryAccumulator.getNextId();
		const textMessage = buildTextMessageFromHistory({
			text: 'replied message',
			stanzaId: 'stanzaReply123',
			timestamp: '2024-03-01T12:00:00Z'
		});
		HistoryAccumulator.pushToCache(queryId, textMessage);

		const repliedMessage = HistoryAccumulator.getRepliedMessage(queryId);
		expect(repliedMessage.text).toBe('replied message');
		expect(repliedMessage.stanzaId).toBe('stanzaReply123');
		expect(new Date(repliedMessage.date).toISOString()).toBe('2024-03-01T12:00:00.000Z');
	});

	test('getHistoryMessages retrieves a list of decoded message', () => {
		const queryId = HistoryAccumulator.getNextId();
		const textMessage1 = buildTextMessageFromHistory({
			text: 'history message 1',
			stanzaId: 'stanzaH1',
			timestamp: '2024-04-01T12:00:00Z'
		});
		const textMessage2 = buildTextMessageFromHistory({
			text: 'history message 2',
			stanzaId: 'stanzaH2',
			timestamp: '2024-05-02T12:00:00Z'
		});
		HistoryAccumulator.pushToCache(queryId, textMessage1);
		HistoryAccumulator.pushToCache(queryId, textMessage2);

		const historyMessages = HistoryAccumulator.getHistoryMessages(queryId);
		expect(historyMessages.length).toBe(2);

		const newerMessage = historyMessages[0] as TextMessage;
		expect(newerMessage.text).toBe('history message 1');
		expect(newerMessage.stanzaId).toBe('stanzaH1');
		expect(new Date(newerMessage.date).toISOString()).toBe('2024-04-01T12:00:00.000Z');

		const olderMessage = historyMessages[1] as TextMessage;
		expect(olderMessage.text).toBe('history message 2');
		expect(olderMessage.stanzaId).toBe('stanzaH2');
		expect(new Date(olderMessage.date).toISOString()).toBe('2024-05-02T12:00:00.000Z');
	});

	test('getFullHistoryMessages retrieves a list of decoded message', () => {
		const queryId = HistoryAccumulator.getNextId();
		const textMessage1 = buildTextMessageFromHistory({
			text: 'full history message 1',
			timestamp: '2024-06-01T12:00:00Z'
		});
		const textMessage2 = buildTextMessageFromHistory({
			text: 'full history message 2',
			timestamp: '2024-07-02T12:00:00Z'
		});
		HistoryAccumulator.pushToCache(queryId, textMessage1);
		HistoryAccumulator.pushToCache(queryId, textMessage2);

		const fullHistoryMessages = HistoryAccumulator.getFullHistoryMessages(queryId);
		expect(fullHistoryMessages.length).toBe(2);

		const olderMessage = fullHistoryMessages[1] as TextMessage;
		expect(olderMessage.text).toBe('full history message 2');
	});
});
