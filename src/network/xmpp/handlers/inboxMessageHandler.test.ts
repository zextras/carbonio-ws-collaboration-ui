/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onInboxMessageStanza } from './inboxMessageHandler';
import useStore from '../../../store/Store';
import {
	buildReactionMessageFromInbox,
	buildReplyMessageFromInbox,
	buildTextMessageFromInbox
} from '../../../tests/buildXmppStanza';
import { createMockTextMessage } from '../../../tests/createMock';
import { MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import HistoryAccumulator from '../utility/HistoryAccumulator';

describe('XMPP inboxMessageHandler tests', () => {
	test('Text message inbox arrives', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildTextMessageFromInbox({
			roomId: message.roomId,
			from: message.from,
			messageId: message.id,
			unread: 0
		});
		onInboxMessageStanza.call(useStore.getState().connections.xmppClient, messageXMPP);

		const textMessage = HistoryAccumulator.getInboxMessages('queryId')[0] as TextMessage;
		expect(textMessage.id).toBe(message.id);
		expect(textMessage.type).toBe(MessageType.TEXT_MSG);
		expect(textMessage.roomId).toBe(message.roomId);
		expect(textMessage.from).toBe(message.from);
	});

	test('Conversation has some unread', () => {
		const spyOnRequestHistory = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestHistory'
		);

		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildTextMessageFromInbox({
			roomId: message.roomId,
			unread: 5
		});
		onInboxMessageStanza.call(useStore.getState().connections.xmppClient, messageXMPP);

		expect(spyOnRequestHistory).toHaveBeenCalled();
	});

	test('Inbox message is a replied one', () => {
		const spyOnRequestRepliedMessage = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'requestMessageSubjectOfReply'
		);

		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildReplyMessageFromInbox({
			roomId: message.roomId,
			replyToStanzaId: '1234'
		});
		onInboxMessageStanza.call(useStore.getState().connections.xmppClient, messageXMPP);

		expect(spyOnRequestRepliedMessage).toHaveBeenCalledTimes(1);
	});

	test('Inbox message is a fastening', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildReactionMessageFromInbox({
			roomId: message.roomId,
			from: message.from,
			originalStanzaId: message.stanzaId,
			reaction: '👍'
		});
		onInboxMessageStanza.call(useStore.getState().connections.xmppClient, messageXMPP);

		const fastenings =
			useStore.getState().chatsRegistry[message.roomId].fastenings[message.stanzaId];
		expect(fastenings[0].type).toBe(MessageType.FASTENING);
		expect(fastenings[0].value).toBe('👍');
	});
});
