/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import { onNewMessageStanza } from './newMessageHandler';
import useStore from '../../../store/Store';
import { createMockMessageFastening, createMockTextMessage } from '../../../tests/createMock';
import { mockedReadMessage, xmppClient } from '../../../tests/mockedXmppClient';
import {
	DateMessage,
	MessageFastening,
	MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';

const createXMPPTextMessage = (textMessage: TextMessage): Element => {
	const parser = new DOMParser();
	const message = `
			<message
				xmlns="jabber:client"
				from="${textMessage.roomId || 'roomId'}@muclight.carbonio/${textMessage.from || 'from'}@carbonio"
				to="${textMessage.from}@carbonio"
				id="${textMessage.id}"
				type="groupchat"
			>
				<body>${textMessage.text}</body>
				<markable xmlns="urn:xmpp:chat-markers:0"></markable>
				${
					textMessage.replyTo &&
					`<reply to='userId' id='${textMessage.replyTo}' xmlns='urn:xmpp:reply:0' />`
				}
				<stanza-id
					xmlns="urn:xmpp:sid:0" by="${textMessage.roomId || 'roomId'}@muclight.carbonio"
					id="${textMessage.stanzaId || 'stanzaId'}"/>
			</message>
		`;
	const xmlToParse = parser.parseFromString(message, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
};

const createXMPPFasteningMessage = (fastening: MessageFastening): Element => {
	const parser = new DOMParser();
	const message = `
			<message
				xmlns="jabber:client"
				from="${fastening.roomId || 'roomId'}@muclight.carbonio/from || 'from'}@carbonio"
				to="from@carbonio"
				id="${fastening.id}"
				type="groupchat"
			>
				${
					fastening.action === 'delete' &&
					`<apply-to id="${fastening.originalStanzaId}" xmlns="urn:xmpp:fasten:0"><retract xmlns='urn:xmpp:message-retract:0'/></apply-to>`
				}
				${
					fastening.action === 'edit' &&
					`<apply-to id="${fastening.originalStanzaId}" xmlns="urn:xmpp:fasten:0"><edit xmlns='zextras:xmpp:edit:0'/><external name="body"/></apply-to><body>${fastening.value}</body>`
				}
			</message>
		`;
	const xmlToParse = parser.parseFromString(message, 'application/xml');
	return xmlToParse.getElementsByTagName('message')[0];
};

describe('XMPP newMessageHandler', () => {
	test('New text message arrives', () => {
		// A new text message arrives
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = createXMPPTextMessage(message);
		onNewMessageStanza.call(xmppClient, messageXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		// when a new message arrive and the previous one inside history has a different date than it, then the date message will be sent with it
		const dateMessage = store.messages[message.roomId][0] as DateMessage;
		const textMessage = store.messages[message.roomId][1] as TextMessage;
		expect(dateMessage).not.toBeNull();
		expect(textMessage).not.toBeNull();
		expect(textMessage.id).toBe(message.id);
		expect(textMessage.stanzaId).toBe(message.stanzaId);
		expect(textMessage.type).toBe(MessageType.TEXT_MSG);
		expect(textMessage.roomId).toBe(message.roomId);
		expect(textMessage.from).toBe(message.from);
		expect(textMessage.text).toBe(message.text);
	});

	test('New replied message arrives', () => {
		const info = createMockTextMessage({ text: 'Hi!', replyTo: 'anotherStanzaId' });
		const message = createXMPPTextMessage(info);
		onNewMessageStanza.call(xmppClient, message);

		// Check if information are stored correctly
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

	test('New delete fastening arrives', () => {
		// A new deletion fastening arrives
		const deletionFastening = createMockMessageFastening({
			action: 'delete',
			originalStanzaId: 'stanzaId'
		});
		const deletionFasteningXMPP = createXMPPFasteningMessage(deletionFastening);
		onNewMessageStanza.call(xmppClient, deletionFasteningXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		const roomFastening = store.fastenings[deletionFastening.roomId];
		expect(roomFastening).toBeDefined();
		expect(roomFastening[deletionFastening.originalStanzaId]).toBeDefined();
		expect(size(roomFastening[deletionFastening.originalStanzaId])).toBe(1);
		expect(roomFastening[deletionFastening.originalStanzaId][0].id).toBe(deletionFastening.id);
	});

	test('New edit fastening arrives', () => {
		// A new edit fastening arrives
		const editFastening = createMockMessageFastening({
			action: 'edit',
			originalStanzaId: 'stanzaId',
			value: 'new text'
		});
		const editFasteningXMPP = createXMPPFasteningMessage(editFastening);
		onNewMessageStanza.call(xmppClient, editFasteningXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		const roomFastening = store.fastenings[editFastening.roomId];
		expect(roomFastening).toBeDefined();
		expect(roomFastening[editFastening.originalStanzaId]).toBeDefined();
		expect(size(roomFastening[editFastening.originalStanzaId])).toBe(1);
		expect(roomFastening[editFastening.originalStanzaId][0].id).toBe(editFastening.id);
	});

	test('readMessage is not called for my own text messages', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = createXMPPTextMessage(message);
		onNewMessageStanza.call(xmppClient, messageXMPP);
		expect(mockedReadMessage).not.toHaveBeenCalled();
	});
});
