/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { requestHistoryWithBackfillCallback } from './requestHistoryWithBackfillCallback';
import useStore from '../../../store/Store';
import {
	buildEndRequestHistoryStanza,
	buildReactionMessageFromHistory,
	buildTextMessageFromHistory
} from '../../../tests/buildXmppStanza';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import HistoryAccumulator from '../utility/HistoryAccumulator';
import { xmppClient } from '../XMPPClient';

const room = createMockRoom({ id: 'mockRoomId' });
const textMessage = createMockTextMessage({ id: 'testId', roomId: room.id });

beforeEach(() => {
	useStore.getState().addRooms([room]);
	useStore.getState().newMessage(createMockTextMessage({ id: 'messageId1', roomId: room.id }));
});
describe('requestHistoryWithBackfillCallback tests', () => {
	test('Fastenings are correctly added to fastening store', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildReactionMessageFromHistory({
				roomId: textMessage.roomId,
				originalStanzaId: textMessage.stanzaId,
				reaction: '👍'
			})
		);
		requestHistoryWithBackfillCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const { fastenings } = useStore.getState().chatsRegistry[textMessage.roomId];
		expect(fastenings[textMessage.stanzaId][0].value).toBe('👍');
	});

	test('Retrieve original message for every replied messages', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({
				roomId: textMessage.roomId,
				replyTo: 'stanzaId'
			})
		);
		const spyOnRequestMessage = vi.spyOn(xmppClient, 'requestMessageSubjectOfReply');
		requestHistoryWithBackfillCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		expect(spyOnRequestMessage).toHaveBeenCalledTimes(1);
	});

	test('Message ranges are correctly added to store', async () => {
		const roomId = 'testRoomId';
		const messageId1 = 'id1';
		const messageId2 = 'id2';
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({
				roomId,
				messageId: messageId1,
				timestamp: '2024-01-01T10:00:00Z'
			})
		);
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({
				roomId,
				messageId: messageId2,
				timestamp: '2024-01-02T10:00:00Z'
			})
		);
		requestHistoryWithBackfillCallback(
			buildEndRequestHistoryStanza({ roomId, isComplete: false }),
			queryId
		);
		const ranges = useStore.getState().chatsRegistry[roomId].messageRanges;
		expect(ranges?.[0].oldestId).toBe(messageId1);
		expect(ranges?.[0].newestId).toBe(messageId2);
	});
});
