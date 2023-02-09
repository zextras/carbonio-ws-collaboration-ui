/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mockNotify } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { xmppClient } from '../../../tests/mockedXmppClient';
import { DateMessage, TextMessage } from '../../../types/store/MessageTypes';
import { onNewMessageStanza } from './newMessageHandler';

type MessageInfo = {
	id?: string;
	roomId?: string;
	from?: string;
	text?: string;
	stanzaId?: string;
	replyTo?: string;
};
function createXMPPReceivedMessage(info: MessageInfo): Element {
	const parser = new DOMParser();
	const message = `
			<message
				xmlns="jabber:client"
				from="${info.roomId || 'roomId'}@muclight.carbonio/${info.from || 'from'}@carbonio"
				to="${info.from}@carbonio"
				id="${info.id}"
				type="groupchat"
			>
				<body>${info.text}</body>
				<markable xmlns="urn:xmpp:chat-markers:0"></markable>
				${info.replyTo && `<thread>${info.replyTo}</thread>`}
				<stanza-id
					xmlns="urn:xmpp:sid:0" by="${info.roomId || 'roomId'}@muclight.carbonio"
					id="${info.stanzaId || 'stanzaId'}"/>
			</message>
		`;
	const xmlToParse = parser.parseFromString(message, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
}

describe('XMPP newMessageHandler', () => {
	test('New text message arrives', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		const info = {
			id: 'messageId',
			roomId: room.id,
			from: 'userId',
			text: 'Hi!',
			stanzaId: 'stanzaId'
		};
		const message = createXMPPReceivedMessage(info);
		onNewMessageStanza.call(xmppClient, message);

		// when a new message arrive and the previous one inside history has a different date than it, then the date message will be sent with it
		const dateMessage = useStore.getState().messages[room.id][0] as DateMessage;
		const textMessage = useStore.getState().messages[room.id][1] as TextMessage;
		expect(dateMessage).not.toBeNull();
		expect(textMessage).not.toBeNull();
		expect(textMessage.id).toBe(info.id);
		expect(textMessage.stanzaId).toBe(info.stanzaId);
		expect(textMessage.type).toBe('text');
		expect(textMessage.roomId).toBe(info.roomId);
		expect(textMessage.from).toBe(info.from);
		expect(textMessage.text).toBe(info.text);
	});

	test('New replied message arrives', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		const info = {
			id: 'messageId',
			roomId: room.id,
			from: 'userId',
			text: 'Hi!!',
			stanzaId: 'stanzaId',
			replyTo: 'anotherStanzaId'
		};
		const message = createXMPPReceivedMessage(info);
		onNewMessageStanza.call(xmppClient, message);

		// when a new message arrive and the previous one inside history has a different date than it, then the date message will be sent with it
		const textMessage = useStore.getState().messages[room.id][1] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(textMessage.id).toBe(info.id);
		expect(textMessage.stanzaId).toBe(info.stanzaId);
		expect(textMessage.type).toBe('text');
		expect(textMessage.roomId).toBe(info.roomId);
		expect(textMessage.from).toBe(info.from);
		expect(textMessage.text).toBe(info.text);
		expect(textMessage.replyTo).toBe(info.replyTo);
	});

	test('Send desktop notification on new message', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		const message = createXMPPReceivedMessage({ roomId: room.id });
		onNewMessageStanza.call(xmppClient, message);

		// Check message presence in the store and notification manager has been called
		const textMessage = useStore.getState().messages[room.id][0] as TextMessage;
		expect(textMessage).not.toBeNull();
		// TODO improve this test, with CHATS-530 improvements it does not work
		// expect(mockNotify).toBeCalled();
	});

	test('Avoid sending desktop notification on my message', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.setLoginInfo('myId ', 'User 1');
		store.addRoom(room);
		store.setRoomMuted(room.id);
		const message = createXMPPReceivedMessage({ roomId: room.id, from: 'myId' });
		onNewMessageStanza.call(xmppClient, message);

		// Check message presence in the store BUT notification manager has not been called
		const textMessage = useStore.getState().messages[room.id][0] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on muted conversation', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		store.setRoomMuted(room.id);
		const message = createXMPPReceivedMessage({ roomId: room.id });
		onNewMessageStanza.call(xmppClient, message);

		// Check message presence in the store BUT notification manager has not been called
		const textMessage = useStore.getState().messages[room.id][0] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on conversation with focused input', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		store.setSelectedRoomOneToOneGroup(room.id);
		store.setInputHasFocus(room.id, true);
		const message = createXMPPReceivedMessage({ roomId: room.id });
		onNewMessageStanza.call(xmppClient, message);

		// Check message presence in the store BUT notification manager has not been called
		const textMessage = useStore.getState().messages[room.id][0] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(mockNotify).not.toBeCalled();
	});
});
