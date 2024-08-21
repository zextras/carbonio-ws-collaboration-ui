/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HistoryAccumulator } from './HistoryAccumulator';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { reactionMessageStanza } from '../../../tests/mocks/XMPPStanza';

const room1 = createMockRoom({ id: '1' });
const room2 = createMockRoom({ id: '2' });

const textMessage1 = createMockTextMessage({
	id: '1',
	roomId: room1.id,
	date: new Date('2021-01-01T00:00:00Z')
});
const textMessage2 = createMockTextMessage({
	id: '1',
	roomId: room2.id,
	date: new Date('2021-01-01T02:00:00Z'),
	replyTo: textMessage1
});

const textMessage3 = createMockTextMessage({
	id: '3',
	roomId: room2.id,
	date: new Date('2021-01-01T03:00:00Z'),
	replyTo: textMessage2
});
const textMessage4 = createMockTextMessage({
	id: '4',
	roomId: room1.id,
	date: new Date('2021-01-01T04:00:00Z')
});

describe('HistoryAccumulator', () => {
	test('Add and return history messages', () => {
		const historyAccumulator = new HistoryAccumulator();
		historyAccumulator.addMessageToHistory(room1.id, textMessage1);
		historyAccumulator.addMessageToHistory(room1.id, textMessage2);
		historyAccumulator.addMessageToHistory(room2.id, textMessage3);
		historyAccumulator.addMessageToHistory(room2.id, textMessage4);
		expect(historyAccumulator.returnHistory(room1.id)).toEqual([textMessage1, textMessage2]);
		expect(historyAccumulator.returnHistory(room1.id)).toEqual([]);
		expect(historyAccumulator.returnHistory(room2.id)).toEqual([textMessage3, textMessage4]);
	});

	test('Add and return replied messages', () => {
		const historyAccumulator = new HistoryAccumulator();
		historyAccumulator.addReferenceForRepliedMessage(textMessage1);
		expect(historyAccumulator.returnReferenceForRepliedMessage(textMessage1.stanzaId)).toEqual(
			textMessage1
		);
	});

	test('Add and return forwarded messages', () => {
		const historyAccumulator = new HistoryAccumulator();
		historyAccumulator.addReferenceForForwardedMessage(
			textMessage3.stanzaId,
			reactionMessageStanza(room2.id, textMessage3.stanzaId, 'user')
		);
		expect(historyAccumulator.returnReferenceForForwardedMessage(textMessage3.stanzaId)).toEqual(
			reactionMessageStanza(room2.id, textMessage3.stanzaId, 'user')
		);
	});
});
