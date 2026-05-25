/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../tests/testStore';

describe('Connections slice', () => {
	test('XmppClient status', () => {
		useStore.getState().setXmppStatus(true);
		expect(useStore.getState().connections.status.xmpp).toBe(true);

		useStore.getState().setXmppStatus(false);
		expect(useStore.getState().connections.status.xmpp).toBe(false);
	});

	test('WebSocketClient status', () => {
		useStore.getState().setWebsocketStatus(true);
		expect(useStore.getState().connections.status.websocket).toBe(true);
		expect(useStore.getState().connections.status.messageBroker).toBe(true);

		useStore.getState().setWebsocketStatus(false);
		expect(useStore.getState().connections.status.websocket).toBe(false);
		expect(useStore.getState().connections.status.messageBroker).toBe(false);
	});

	test('ChatsBe status', () => {
		useStore.getState().setChatsBeStatus(true);
		expect(useStore.getState().connections.status.chats_be).toBe(true);

		useStore.getState().setChatsBeStatus(false);
		expect(useStore.getState().connections.status.chats_be).toBe(false);
	});

	test('MessageBroker status', () => {
		useStore.getState().setMessageBrokerStatus(true);
		expect(useStore.getState().connections.status.messageBroker).toBe(true);

		useStore.getState().setMessageBrokerStatus(false);
		expect(useStore.getState().connections.status.messageBroker).toBe(false);
	});

	// TODO
	// test('Reset XMPP data', () => {
	// 	const user = createMockUser({ id: '1', online: true });
	// 	const room1 = createMockRoom({ id: '1' });
	// 	const room2 = createMockRoom({ id: '2' });
	// 	const message1 = createMockTextMessage({ id: '1', roomId: room1.id });
	// 	const message2 = createMockTextMessage({ id: '2', roomId: room2.id });
	// 	const marker1 = createMockMarker({ messageId: message1.id });
	// 	const marker2 = createMockMarker({ messageId: message2.id });
	//
	// 	// API effects to store
	// 	useStore.getState().setLoginInfo({ id: 'userId', name: 'User' });
	// 	useStore.getState().setUserInfo([user]);
	// 	useStore.getState().addRooms([room1, room2]);
	//
	// 	const initialStore = useStore.getState();
	//
	// 	// XMPP effects to store
	// 	useStore.getState().setLoginInfo({ id: 'userId', name: 'User' });
	// 	useStore.getState().setUserInfo([user]);
	// 	useStore.getState().setInboxMessages([message1]);
	// 	useStore.getState().updateHistory(room1.id, [message1]);
	// 	useStore.getState().updateHistory(room2.id, [message2]);
	// 	useStore.getState().updateReadStatus(room1.id, [marker1]);
	// 	useStore.getState().updateReadStatus(room2.id, [marker2]);
	//
	// 	useStore.getState().resetXmppData();
	//
	// 	expect(useStore.getState().session).toEqual(initialStore.session);
	// 	expect(useStore.getState().rooms).toEqual(initialStore.rooms);
	// 	expect(useStore.getState().users[user.id].online).toBeUndefined();
	// 	expect(useStore.getState().rooms).toEqual(initialStore.rooms);
	// 	expect(useStore.getState().chatsRegistry).toEqual(initialStore.chatsRegistry);
	// });
});
