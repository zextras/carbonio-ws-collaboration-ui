/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createInboxMessageHandler } from './inboxMessageHandler';
import { buildTextMessageFromInbox } from '../../../tests/buildXmppStanza';
import { createMockTextMessage } from '../../../tests/createMock';
import { mockMessagingService } from '../../../tests/mock-messaging-service';
import { MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import HistoryAccumulator from '../utility/HistoryAccumulator';

const onInboxMessageStanza = createInboxMessageHandler(mockMessagingService);

describe('XMPP inboxMessageHandler tests', () => {
	test('Text message inbox arrives', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildTextMessageFromInbox({
			roomId: message.roomId,
			from: message.from,
			messageId: message.id,
			unread: 0
		});
		onInboxMessageStanza(messageXMPP);

		const textMessage = HistoryAccumulator.getInboxMessages('queryId')[0] as TextMessage;
		expect(textMessage.id).toBe(message.id);
		expect(textMessage.type).toBe(MessageType.TEXT_MSG);
		expect(textMessage.roomId).toBe(message.roomId);
		expect(textMessage.from).toBe(message.from);
	});

	test('Conversation has some unread (< 15)', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildTextMessageFromInbox({
			roomId: message.roomId,
			unread: 5
		});
		onInboxMessageStanza(messageXMPP);

		expect(mockMessagingService.requestHistory).toHaveBeenCalled();
	});

	test('Conversation has a lot of unread', () => {
		const message = createMockTextMessage({ text: 'Hi!' });
		const messageXMPP = buildTextMessageFromInbox({
			roomId: message.roomId,
			unread: 30
		});
		onInboxMessageStanza(messageXMPP);

		expect(mockMessagingService.requestHistory).not.toHaveBeenCalled();
	});
});
