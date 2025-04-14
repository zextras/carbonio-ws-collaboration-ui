/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	createMockConfigurationMessage,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { MessageType, OperationType } from '../../types/store/ChatsRegistryTypes';
import { dateToISODate, dateToTimestamp } from '../../utils/dateUtils';
import useStore from '../Store';

const textMessage0 = createMockTextMessage({
	id: 'message0',
	date: dateToTimestamp('2024-05-01 12:02')
});

const textMessage1 = createMockTextMessage({
	id: 'message1',
	date: dateToTimestamp('2024-05-01 13:02')
});

const newTextMessage = createMockTextMessage({
	id: 'newMessage',
	date: dateToTimestamp('2024-05-01 14:02')
});

describe('ChatsRegistryStoreSlice tests', () => {
	describe('newMessage', () => {
		test('Arrive a text message as first', () => {
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).not.toBeNull();
			expect(messages).toHaveLength(2);

			// Messages list: [DATE, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(newTextMessage);
		});

		test('Arrive a text message in a conversation already full of messages of the same day', () => {
			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			// Messages list: [DATE, MESSAGE0, MESSAGE1, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(textMessage0);
			expect(messages[2]).toBe(textMessage1);
			expect(messages[3]).toBe(newTextMessage);
		});

		test('Arrive a text message in a conversation already full of messages of the another day', () => {
			const newMessage = createMockTextMessage({
				id: 'newMessage',
				date: dateToTimestamp('2024-05-02 10:00')
			});

			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().newMessage(newMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			// Messages list: [DATE, MESSAGE0, MESSAGE1, DATE, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(textMessage0);
			expect(messages[2]).toBe(textMessage1);
			expect(messages[3].type).toBe(MessageType.DATE_MSG);
			expect(messages[4]).toBe(newMessage);
		});

		test('Arrive an configuration message as first', () => {
			const newMessage = createMockConfigurationMessage({ operation: OperationType.MEMBER_ADDED });
			useStore.getState().newMessage(newMessage);
			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).not.toBeNull();
			expect(messages).toHaveLength(2);

			// Messages list: [DATE, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(newMessage);
		});
	});

	describe('newInboxMessage', () => {
		test('Arrive an inbox text message', () => {
			const inboxMessage = createMockTextMessage();
			useStore.getState().newInboxMessage(inboxMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).not.toBeNull();
			expect(messages).toHaveLength(2);

			// Messages list: [DATE, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(inboxMessage);
		});

		test('Arrive an inbox text message after a history request (also with different date)', () => {
			const inboxMessage = createMockTextMessage({
				id: textMessage1.id,
				date: dateToTimestamp('2024-05-01 13:01:05')
			});
			useStore.getState().updateHistory(inboxMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().newInboxMessage(inboxMessage);

			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			// Messages list: [DATE, MESSAGE0, MESSAGE1]]
			expect(messages).toHaveLength(3);
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toBe(textMessage0);
			expect(messages[2]).toBe(textMessage1);
		});

		test('Arrive an inbox message of a room in which history is been cleared before message date', () => {
			const room = createMockRoom({
				userSettings: {
					muted: false,
					clearedAt: dateToISODate('2024-05-01 12:00')
				}
			});
			const inboxMessage = createMockTextMessage({
				roomId: room.id,
				date: dateToTimestamp('2024-05-01 13:00')
			});
			useStore.getState().addRooms([room]);
			useStore.getState().newInboxMessage(inboxMessage);

			// Messages list: [DATE, INBOX MESSAGE]
			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			expect(messages[1]).toStrictEqual(inboxMessage);
		});

		test('Arrive an inbox message of a room in which history is been cleared after message date', () => {
			const room = createMockRoom({
				userSettings: {
					muted: false,
					clearedAt: dateToISODate('2024-05-01 12:00')
				}
			});
			const inboxMessage = createMockTextMessage({
				roomId: room.id,
				date: dateToTimestamp('2024-05-01 11:00')
			});
			useStore.getState().addRooms([room]);
			useStore.getState().newInboxMessage(inboxMessage);

			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			// Messages list: []
			expect(messages).toHaveLength(0);
		});
	});

	describe('Placeholder messages', () => {
		test('Arrive a new message to replace the placeholder message', () => {
			useStore.getState().setPlaceholderMessage({
				roomId: newTextMessage.roomId,
				id: newTextMessage.id,
				text: newTextMessage.text
			});
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			// Messages list: [DATE, NEW MESSAGE]
			expect(messages[0].type).toBe(MessageType.DATE_MSG);
			expect(messages[1]).toStrictEqual(newTextMessage);
		});
	});
});
