/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MamRequestType, onHistoryMessageStanza, onRequestHistory } from './historyMessageHandler';
import useStore from '../../../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage
} from '../../../tests/createMock';
import {
	endRequestHistoryStanza,
	historyTextMessageStanza,
	reactionMessageFromHistoryStanza,
	replyTextMessageStanza
} from '../../../tests/mocks/XMPPStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

const room = createMockRoom();
const textMessage = createMockTextMessage({ roomId: room.id });
const fastening = createMockMessageFastening({ roomId: room.id });

describe('onHistoryMessageStanza', () => {
	test('Handle text history message stanza', () => {
		onHistoryMessageStanza(
			historyTextMessageStanza('roomId', 'from', 'body', MamRequestType.HISTORY)
		);
		expect(HistoryAccumulator.returnHistory('roomId')).toHaveLength(1);
	});

	test('Handle fastening history message stanza ', () => {
		onHistoryMessageStanza(
			reactionMessageFromHistoryStanza(
				'roomId',
				'originalStanzaId',
				'userId',
				MamRequestType.HISTORY
			)
		);
		expect(useStore.getState().fastenings.roomId.originalStanzaId).toHaveLength(1);
	});

	test('Handle replied history message stanza', () => {
		onHistoryMessageStanza(
			replyTextMessageStanza('roomId', 'from', 'body', MamRequestType.REPLIED, 'stanzaId')
		);
		expect(HistoryAccumulator.returnReferenceForRepliedMessage('stanzaId')).toBeDefined();
	});
});

beforeEach(() => {
	useStore.getState().addRoom(room);
});
describe('onRequestHistory', () => {
	test('End request history stanza indicates MAM request is incomplete', () => {
		HistoryAccumulator.addMessageToHistory(room.id, textMessage);
		onRequestHistory(endRequestHistoryStanza(room.id, false));
		const store = useStore.getState();
		expect(store.activeConversations[room.id].lastMamMessage).toBe(textMessage);
		expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeUndefined();
	});

	test('End request history stanza indicates MAM request is complete', () => {
		HistoryAccumulator.addMessageToHistory(room.id, textMessage);
		onRequestHistory(endRequestHistoryStanza(room.id, true));
		const store = useStore.getState();
		expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeTruthy();
	});

	test('MAM request is incomplete but there are no history message', () => {
		onRequestHistory(endRequestHistoryStanza(room.id, false));
		const store = useStore.getState();
		expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeTruthy();
	});

	test('Request history again if there are only fastenings', () => {
		const spyOnRequestHistory = jest.spyOn(
			useStore.getState().connections.xmppClient,
			'requestHistory'
		);
		HistoryAccumulator.addMessageToHistory(room.id, fastening);
		onRequestHistory(endRequestHistoryStanza(room.id, false));
		expect(spyOnRequestHistory).toHaveBeenCalled();
	});
});
