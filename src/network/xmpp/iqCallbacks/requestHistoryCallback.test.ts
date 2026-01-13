/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { requestHistoryCallback } from './requestHistoryCallback';
import useStore from '../../../store/Store';
import {
	buildEndRequestHistoryStanza,
	buildReactionMessageFromHistory,
	buildTextMessageFromHistory
} from '../../../tests/buildXmppStanza';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import HistoryAccumulator from '../utility/HistoryAccumulator';

const room = createMockRoom({ id: 'mockRoomId' });
const textMessage = createMockTextMessage({ id: 'testId', roomId: room.id });

beforeEach(() => {
	useStore.getState().addRooms([room]);
	useStore.getState().newMessage(createMockTextMessage({ id: 'messageId1', roomId: room.id }));
});
describe('requestHistoryCallback', () => {
	test('End request history stanza indicates MAM request is incomplete', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeUndefined();
	});

	test('End request history stanza indicates MAM request is complete', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: true }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
	});

	test('MAM request is incomplete but there are no history message', () => {
		const queryId = HistoryAccumulator.getNextId();
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
	});

	test('Request history again if there are only fastenings', () => {
		const spyOnRequestHistory = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestHistory'
		);
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildReactionMessageFromHistory({ messageId: textMessage.id, roomId: textMessage.roomId })
		);
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: true }),
			queryId
		);
		const store = useStore.getState();
		expect(store.activeConversations[textMessage.roomId].isHistoryFullyLoaded).toBeTruthy();
		expect(spyOnRequestHistory).toHaveBeenCalled();
	});

	test('Fastenings are added to fastening store', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildReactionMessageFromHistory({
				roomId: textMessage.roomId,
				originalStanzaId: textMessage.stanzaId,
				reaction: '😀'
			})
		);
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		const { fastenings } = useStore.getState().chatsRegistry[textMessage.roomId];
		expect(fastenings[textMessage.stanzaId][0].value).toBe('😀');
	});

	test('Retrieve original message for replied messages', () => {
		const queryId = HistoryAccumulator.getNextId();
		HistoryAccumulator.pushToCache(
			queryId,
			buildTextMessageFromHistory({
				roomId: textMessage.roomId,
				replyTo: 'stanzaId'
			})
		);
		const spyOnRequestMessage = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageSubjectOfReply'
		);
		requestHistoryCallback(
			buildEndRequestHistoryStanza({ roomId: textMessage.roomId, isComplete: false }),
			queryId
		);
		expect(spyOnRequestMessage).toHaveBeenCalledTimes(1);
	});
});
