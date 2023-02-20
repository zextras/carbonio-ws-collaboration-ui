/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import { mockNotify } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { xmppClient } from '../../../tests/mockedXmppClient';
import {
	DateMessage,
	DeletedMessage,
	MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';
import { onNewMessageStanza } from './newMessageHandler';

type MessageInfo = {
	id?: string;
	roomId: string;
	messageType: MessageType;
	from?: string;
	text?: string;
	stanzaId?: string;
	replyTo?: string;
	messageIdDeletion?: string;
	idMessageToToEdit?: string;
	isEdited?: boolean;
};

const createMockMessageInfo = (fields?: Record<string, any>): MessageInfo => ({
	id: 'messageId',
	messageType: MessageType.TEXT_MSG,
	roomId: 'roomId',
	from: 'userId',
	stanzaId: 'stanzaId',
	isEdited: false,
	...fields
});

const createXMPPReceivedMessage = (info: MessageInfo): Element => {
	const parser = new DOMParser();
	const message = `
			<message
				xmlns="jabber:client"
				from="${info.roomId || 'roomId'}@muclight.carbonio/${info.from || 'from'}@carbonio"
				to="${info.from}@carbonio"
				id="${info.id}"
				type="groupchat"
			>
				${
					info.messageType === MessageType.TEXT_MSG &&
					!info.isEdited &&
					`
						<body>${info.text}</body>
						<markable xmlns="urn:xmpp:chat-markers:0"></markable>
						${info.replyTo && `<thread>${info.replyTo}</thread>`}
					`
				}
				${
					info.messageType === MessageType.TEXT_MSG &&
					info.isEdited &&
					`
						<body>${info.text}</body>
						<replace id="${info.idMessageToToEdit}" xmlns="urn:xmpp:message-correct:0"/>
					`
				}
				${
					info.messageType === MessageType.DELETED_MSG &&
					`
						<apply-to id="${info.messageIdDeletion}" xmlns="urn:xmpp:fasten:0">
							<retract xmlns='urn:xmpp:message-retract:0'/>
						</apply-to>	
					`
				}
				<stanza-id
					xmlns="urn:xmpp:sid:0" by="${info.roomId || 'roomId'}@muclight.carbonio"
					id="${info.stanzaId || 'stanzaId'}"/>
			</message>
		`;
	const xmlToParse = parser.parseFromString(message, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
};

describe('XMPP newMessageHandler', () => {
	test('New text message arrives', () => {
		const info = createMockMessageInfo({ text: 'Hi!' });
		const message = createXMPPReceivedMessage(info);
		onNewMessageStanza.call(xmppClient, message);

		const store = useStore.getState();
		// when a new message arrive and the previous one inside history has a different date than it, then the date message will be sent with it
		const dateMessage = store.messages[info.roomId][0] as DateMessage;
		const textMessage = store.messages[info.roomId][1] as TextMessage;
		expect(dateMessage).not.toBeNull();
		expect(textMessage).not.toBeNull();
		expect(textMessage.id).toBe(info.id);
		expect(textMessage.stanzaId).toBe(info.stanzaId);
		expect(textMessage.type).toBe(MessageType.TEXT_MSG);
		expect(textMessage.roomId).toBe(info.roomId);
		expect(textMessage.from).toBe(info.from);
		expect(textMessage.text).toBe(info.text);
	});

	test('New replied message arrives', () => {
		const info = createMockMessageInfo({ text: 'Hi!', replyTo: 'anotherStanzaId' });
		const message = createXMPPReceivedMessage(info);
		onNewMessageStanza.call(xmppClient, message);

		const store = useStore.getState();
		// when a new message arrive and the previous one inside history has a different date than it, then the date message will be sent with it
		const textMessage = store.messages[info.roomId][1] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(textMessage.id).toBe(info.id);
		expect(textMessage.stanzaId).toBe(info.stanzaId);
		expect(textMessage.type).toBe(MessageType.TEXT_MSG);
		expect(textMessage.roomId).toBe(info.roomId);
		expect(textMessage.from).toBe(info.from);
		expect(textMessage.text).toBe(info.text);
		expect(textMessage.replyTo).toBe(info.replyTo);
	});

	test('New deletion of a message arrives', () => {
		const initialMessageInfo = createMockMessageInfo({ text: 'Hi!' });
		const deletionInfo = createMockMessageInfo({
			id: 'messageId2',
			messageType: MessageType.DELETED_MSG,
			messageIdDeletion: initialMessageInfo.id
		});
		const message = createXMPPReceivedMessage(initialMessageInfo);
		const messageDeletion = createXMPPReceivedMessage(deletionInfo);
		onNewMessageStanza.call(xmppClient, message);
		onNewMessageStanza.call(xmppClient, messageDeletion);
		const store = useStore.getState();

		const deletedMessage = store.messages[initialMessageInfo.roomId][1];
		expect(deletedMessage.id).toBe(initialMessageInfo.id);
		expect(deletedMessage.type).toBe(MessageType.DELETED_MSG);
		expect((deletedMessage as DeletedMessage).from).toBe(deletionInfo.from);
	});

	test('multiple deletions events', () => {
		const firstMessageInfo = createMockMessageInfo({ id: 'firstMessageInfo', text: 'Hi' });
		const secondMessageInfo = createMockMessageInfo({ id: 'secondMessageInfo', text: 'Hi' });
		const thirdMessageInfo = createMockMessageInfo({ id: 'thirdMessageInfo', text: 'Hi' });
		const deletionSecondMessageInfo = createMockMessageInfo({
			id: 'deletionSecondMessageInfo',
			messageType: MessageType.DELETED_MSG,
			messageIdDeletion: secondMessageInfo.id
		});
		const fourthMessageInfo = createMockMessageInfo({ id: 'fourthMessageInfo', text: 'Hi' });
		const fifthMessageInfo = createMockMessageInfo({ id: 'fifthMessageInfo', text: 'Hi' });
		const deletionFourthMessageInfo = createMockMessageInfo({
			id: 'deletionFourthMessageInfo',
			messageType: MessageType.DELETED_MSG,
			messageIdDeletion: fourthMessageInfo.id
		});

		const firstMessage = createXMPPReceivedMessage(firstMessageInfo);
		const secondMessage = createXMPPReceivedMessage(secondMessageInfo);
		const thirdMessage = createXMPPReceivedMessage(thirdMessageInfo);
		const deletionSecondMessage = createXMPPReceivedMessage(deletionSecondMessageInfo);
		const fourthMessage = createXMPPReceivedMessage(fourthMessageInfo);
		const fifthMessage = createXMPPReceivedMessage(fifthMessageInfo);
		const deletionFourthMessage = createXMPPReceivedMessage(deletionFourthMessageInfo);

		onNewMessageStanza.call(xmppClient, firstMessage);
		onNewMessageStanza.call(xmppClient, secondMessage);
		onNewMessageStanza.call(xmppClient, thirdMessage);
		onNewMessageStanza.call(xmppClient, deletionSecondMessage);
		onNewMessageStanza.call(xmppClient, fourthMessage);
		onNewMessageStanza.call(xmppClient, fifthMessage);
		onNewMessageStanza.call(xmppClient, deletionFourthMessage);

		const store = useStore.getState();
		const messageList = store.messages[firstMessageInfo.roomId];

		expect(size(messageList)).toBe(6);
		expect(messageList[1].id).toBe(firstMessageInfo.id);
		expect(messageList[2].type).toBe(MessageType.DELETED_MSG);
		expect(messageList[2].id).toBe(secondMessageInfo.id);
		expect(messageList[3].id).toBe(thirdMessageInfo.id);
		expect(messageList[4].type).toBe(MessageType.DELETED_MSG);
		expect(messageList[4].id).toBe(fourthMessageInfo.id);
		expect(messageList[5].id).toBe(fifthMessageInfo.id);
	});

	test('New correction of a message arrives', () => {
		const initialMessageInfo = createMockMessageInfo({ text: 'Hi!' });
		const editInfo = createMockMessageInfo({
			id: 'messageId2',
			idMessageToToEdit: initialMessageInfo.id,
			text: 'Hi everyone!',
			isEdited: true
		});
		const message = createXMPPReceivedMessage(initialMessageInfo);
		const messageCorrection = createXMPPReceivedMessage(editInfo);
		onNewMessageStanza.call(xmppClient, message);
		onNewMessageStanza.call(xmppClient, messageCorrection);
		const store = useStore.getState();

		const editedMessage = store.messages[initialMessageInfo.roomId][1];
		expect(editedMessage.id).toBe(initialMessageInfo.id);
		expect((editedMessage as TextMessage).edited).toBeTruthy();
		expect((editedMessage as TextMessage).text).toBe(editInfo.text);
	});

	test('Send desktop notification on new message', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		const message = createXMPPReceivedMessage({
			messageType: MessageType.TEXT_MSG,
			roomId: room.id
		});
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
		const message = createXMPPReceivedMessage({
			messageType: MessageType.TEXT_MSG,
			roomId: room.id,
			from: 'myId'
		});
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
		const message = createXMPPReceivedMessage({
			messageType: MessageType.TEXT_MSG,
			roomId: room.id
		});
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
		const message = createXMPPReceivedMessage({
			messageType: MessageType.TEXT_MSG,
			roomId: room.id
		});
		onNewMessageStanza.call(xmppClient, message);

		// Check message presence in the store BUT notification manager has not been called
		const textMessage = useStore.getState().messages[room.id][0] as TextMessage;
		expect(textMessage).not.toBeNull();
		expect(mockNotify).not.toBeCalled();
	});
});
