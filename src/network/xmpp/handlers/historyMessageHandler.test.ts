/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onRequestHistory } from './historyMessageHandler';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import {
	buildEndRequestHistoryStanza,
	buildReactionMessageFromHistory,
	buildTextMessageFromHistory
} from '../../../tests/mocks/buildXmppStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

const room = createMockRoom({ id: 'mockRoomId' });
const textMessage = createMockTextMessage({ id: 'testId', roomId: room.id });

beforeEach(() => {
	useStore.getState().addRooms([room]);
	useStore.getState().newMessage(createMockTextMessage({ id: 'messageId1', roomId: room.id }));
});
describe('onRequestHistory', () => {
	test('End request history stanza indicates MAM request is incomplete', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		onRequestHistory(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].lastMamMessage?.id).toBe(textMessage.id);
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeUndefined();
	});

	test('End request history stanza indicates MAM request is complete', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		onRequestHistory(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: true }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
	});

	test('MAM request is incomplete but there are no history message', () => {
		const queryId = HistoryAccumulator.getNextId();
		onRequestHistory(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
	});

	test('Request history again if there are only fastenings', () => {
		const spyOnRequestHistory = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestHistory'
		);
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildReactionMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		onRequestHistory(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: true }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
		expect(spyOnRequestHistory).toHaveBeenCalled();
	});
});
