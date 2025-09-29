/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// import { onHistoryMessageStanza, onRequestHistory } from './historyMessageHandler';
// import useStore from '../../../store/Store';
// import {
// 	createMockMessageFastening,
// 	createMockRoom,
// 	createMockTextMessage
// } from '../../../tests/createMock';
// import {
// 	endRequestHistoryStanza,
// 	historyTextMessageStanza,
// 	reactionMessageFromHistoryStanza,
// 	replyTextMessageStanza
// } from '../../../tests/mocks/XMPPStanza';
// import HistoryAccumulator from '../utility/HistoryAccumulator';
//
// const room = createMockRoom();
// const textMessage = createMockTextMessage({ roomId: room.id });
// const fastening = createMockMessageFastening({ roomId: room.id });
//
// beforeEach(() => {
// 	useStore.getState().addRooms([room]);
// });

// TODO: add new implementation of HistoryAccumulator tests
describe('onRequestHistory', () => {
	// test('End request history stanza indicates MAM request is incomplete', () => {
	// 	HistoryAccumulator.addMessageToHistory(room.id, textMessage);
	// 	onRequestHistory(endRequestHistoryStanza(room.id, false));
	// 	const store = useStore.getState();
	// 	expect(store.activeConversations[room.id].lastMamMessage).toBe(textMessage);
	// 	expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeUndefined();
	// });
	//
	// test('End request history stanza indicates MAM request is complete', () => {
	// 	HistoryAccumulator.addMessageToHistory(room.id, textMessage);
	// 	onRequestHistory(endRequestHistoryStanza(room.id, true));
	// 	const store = useStore.getState();
	// 	expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeTruthy();
	// });
	//
	// test('MAM request is incomplete but there are no history message', () => {
	// 	onRequestHistory(endRequestHistoryStanza(room.id, false));
	// 	const store = useStore.getState();
	// 	expect(store.activeConversations[room.id].isHistoryFullyLoaded).toBeTruthy();
	// });
	//
	// test('Request history again if there are only fastenings', () => {
	// 	const spyOnRequestHistory = jest.spyOn(
	// 		useStore.getState().connections.xmppClient,
	// 		'requestHistory'
	// 	);
	// 	HistoryAccumulator.addMessageToHistory(room.id, fastening);
	// 	onRequestHistory(endRequestHistoryStanza(room.id, false));
	// 	expect(spyOnRequestHistory).toHaveBeenCalled();
	// });
});
