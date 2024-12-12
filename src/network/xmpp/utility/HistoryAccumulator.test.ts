/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import HistoryAccumulator from './HistoryAccumulator';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { reactionMessageFromHistoryStanza } from '../../../tests/mocks/XMPPStanza';
import { dateToTimestamp } from '../../../utils/dateUtils';

const room1 = createMockRoom({ id: '1' });
const room2 = createMockRoom({ id: '2' });

const textMessage1 = createMockTextMessage({
	id: '1',
	roomId: room1.id,
	date: dateToTimestamp('2021-01-01T00:00:00Z')
});
const textMessage2 = createMockTextMessage({
	id: '1',
	roomId: room2.id,
	date: dateToTimestamp('2021-01-01T02:00:00Z'),
	replyTo: textMessage1.id
});

const textMessage3 = createMockTextMessage({
	id: '3',
	roomId: room2.id,
	date: dateToTimestamp('2021-01-01T03:00:00Z'),
	replyTo: textMessage2.id
});
const textMessage4 = createMockTextMessage({
	id: '4',
	roomId: room1.id,
	date: dateToTimestamp('2021-01-01T04:00:00Z')
});

describe('HistoryAccumulator', () => {
	test('Add and return history messages', () => {
		HistoryAccumulator.addMessageToHistory(room1.id, textMessage1);
		HistoryAccumulator.addMessageToHistory(room1.id, textMessage2);
		HistoryAccumulator.addMessageToHistory(room2.id, textMessage3);
		HistoryAccumulator.addMessageToHistory(room2.id, textMessage4);
		expect(HistoryAccumulator.returnHistory(room1.id)).toEqual([textMessage1, textMessage2]);
		expect(HistoryAccumulator.returnHistory(room1.id)).toEqual([]);
		expect(HistoryAccumulator.returnHistory(room2.id)).toEqual([textMessage3, textMessage4]);
	});

	test('Add and return replied messages', () => {
		HistoryAccumulator.addReferenceForRepliedMessage(textMessage1);
		expect(HistoryAccumulator.returnReferenceForRepliedMessage(textMessage1.stanzaId)).toEqual(
			textMessage1
		);
	});

	test('Add and return forwarded messages', () => {
		HistoryAccumulator.addReferenceForForwardedMessage(
			textMessage3.stanzaId,
			reactionMessageFromHistoryStanza(room2.id, textMessage3.stanzaId, 'user', 'queryId')
		);
		expect(HistoryAccumulator.returnReferenceForForwardedMessage(textMessage3.stanzaId)).toEqual(
			reactionMessageFromHistoryStanza(room2.id, textMessage3.stanzaId, 'user', 'queryId')
		);
	});
});
