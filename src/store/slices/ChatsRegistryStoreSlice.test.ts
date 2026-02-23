/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, last } from 'lodash';

import {
	createMockConfigurationMessage,
	createMockMarker,
	createMockMember,
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import {
	BackfillRequest,
	ConfigurationMessage,
	FasteningAction,
	MarkerStatus,
	MessageRange,
	MessageType,
	OperationType,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { dateToISODate, dateToTimestamp } from '../../utils/dateUtils';
import useStore from '../Store';

const date1 = dateToTimestamp('2024-05-01 12:00');
const date2 = dateToTimestamp('2024-05-01 13:00');
const date3 = dateToTimestamp('2024-05-01 14:00');

const textMessage0 = createMockTextMessage({
	id: 'message0',
	date: date1
});

const textMessage1 = createMockTextMessage({
	id: 'message1',
	date: date2
});

const newTextMessage = createMockTextMessage({
	id: 'newMessage',
	date: date3
});

describe('ChatsRegistryStoreSlice tests', () => {
	describe('newMessage', () => {
		test('Arrive a text message as first', () => {
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).toHaveLength(1);
			expect(messages[0]).toBe(newTextMessage);
		});

		test('Arrive a text message in a conversation already full of messages', () => {
			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			// Messages list: [MESSAGE0, MESSAGE1, NEW MESSAGE]
			expect(messages[0]).toBe(textMessage0);
			expect(messages[1]).toBe(textMessage1);
			expect(messages[2]).toBe(newTextMessage);
		});

		test('Arrive an configuration message as first', () => {
			const newMessage = createMockConfigurationMessage({ operation: OperationType.MEMBER_ADDED });
			useStore.getState().newMessage(newMessage);
			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).toHaveLength(1);
			expect(messages[0]).toBe(newMessage);
		});
	});

	describe('newInboxMessage', () => {
		test('Arrive an inbox text message', () => {
			const inboxMessage = createMockTextMessage();
			useStore.getState().newInboxMessages([inboxMessage]);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages).toHaveLength(1);
			expect(messages[0]).toBe(inboxMessage);
		});

		test('Arrive an inbox text message after a history request', () => {
			const inboxMessage = createMockTextMessage({
				id: textMessage1.id,
				date: dateToTimestamp('2024-05-01 13:01:05')
			});
			useStore.getState().updateHistory(inboxMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().newInboxMessages([inboxMessage]);

			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			// Messages list: [MESSAGE0, MESSAGE1]]
			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(textMessage0);
			expect(messages[1]).toBe(textMessage1);
		});

		test('Arrive an inbox message of a room in which history is been cleared before message date', () => {
			const room = createMockRoom({
				userSettings: {
					muted: false,
					clearedAt: dateToISODate(date1)
				}
			});
			const inboxMessage = createMockTextMessage({
				roomId: room.id,
				date: date2
			});
			useStore.getState().addRooms([room]);
			useStore.getState().newInboxMessages([inboxMessage]);

			// Messages list: [DATE, INBOX MESSAGE]
			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			expect(messages[0]).toStrictEqual(inboxMessage);
		});

		test('Arrive an inbox message of a room in which history is been cleared after message date', () => {
			const room = createMockRoom({
				userSettings: {
					muted: false,
					clearedAt: dateToISODate(date2)
				}
			});
			const inboxMessage = createMockTextMessage({
				roomId: room.id,
				date: date1
			});
			useStore.getState().addRooms([room]);
			useStore.getState().newInboxMessages([inboxMessage]);

			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			// Messages list: []
			expect(messages).toHaveLength(0);
		});
	});

	describe('updateHistory', () => {
		test('First update history after an inbox message', () => {
			useStore.getState().newInboxMessages([newTextMessage]);
			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			// Messages list: [MESSAGE0, MESSAGE1, INBOX MESSAGE]
			expect(messages).toHaveLength(3);
			expect(messages[0]).toBe(textMessage0);
			expect(messages[1]).toBe(textMessage1);
			expect(messages[2]).toBe(newTextMessage);
		});

		test('Last message of history is the inbox message', () => {
			const inboxMessage = createMockTextMessage({
				id: 'newMessage',
				date: dateToTimestamp('2024-05-01 14:04')
			});
			useStore.getState().newInboxMessages([inboxMessage]);
			useStore.getState().updateHistory(inboxMessage.roomId, [textMessage0, inboxMessage]);

			const { messages } = useStore.getState().chatsRegistry[inboxMessage.roomId];
			// Messages list: [MESSAGE0, INBOX MESSAGE]
			expect(messages).toHaveLength(2);
			expect(messages[1]).toBe(inboxMessage);
		});

		test('Load a history after another history', () => {
			useStore.getState().updateHistory(textMessage0.roomId, [textMessage0, textMessage1]);

			const msg2 = createMockTextMessage({
				id: 'msg2',
				date: dateToTimestamp('2024-04-29 20:00')
			});
			const msg3 = createMockTextMessage({
				id: 'msg3',
				date: dateToTimestamp('2024-04-29 13:59')
			});
			useStore.getState().updateHistory(textMessage0.roomId, [msg2, msg3]);

			const { messages } = useStore.getState().chatsRegistry[textMessage0.roomId];
			// Messages list: [MESSAGE0, MESSAGE1, MESSAGE2, MESSAGE3]
			expect(messages).toHaveLength(4);
		});

		test('Arrive an history already loaded', () => {
			useStore.getState().updateHistory(textMessage0.roomId, [textMessage0, textMessage1]);
			useStore.getState().updateHistory(textMessage0.roomId, [textMessage0, textMessage1]);
			useStore.getState().updateHistory(textMessage0.roomId, [textMessage1]);

			const { messages } = useStore.getState().chatsRegistry[textMessage0.roomId];
			expect(messages).toHaveLength(2);
		});
	});

	describe('addCreateRoomMessage', () => {
		test('Add a create room message to a group', () => {
			const room = createMockRoom({ type: RoomType.GROUP });
			useStore.getState().addRooms([room]);

			useStore.getState().updateHistory(room.id, [textMessage0, textMessage1]);
			useStore.getState().addCreateRoomMessage(room.id);

			const { messages } = useStore.getState().chatsRegistry[room.id];
			// Messages list: [CREATE ROOM, MESSAGE0, MESSAGE1]
			expect(messages).toHaveLength(3);
			expect(messages[0].type).toBe(MessageType.CONFIGURATION_MSG);
			expect((messages[0] as ConfigurationMessage).operation).toBe(OperationType.ROOM_CREATION);
		});

		test('Add a create room message to a single conversation', () => {
			const room = createMockRoom({ type: RoomType.ONE_TO_ONE });
			useStore.getState().addRooms([room]);

			useStore.getState().updateHistory(room.id, [textMessage0, textMessage1]);
			useStore.getState().addCreateRoomMessage(room.id);

			const { messages } = useStore.getState().chatsRegistry[room.id];
			// Messages list: [MESSAGE0, MESSAGE1]
			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(textMessage0);
		});

		test('Add a create room message to a group with cleared history', () => {
			const room = createMockRoom({
				type: RoomType.GROUP,
				userSettings: { muted: false, clearedAt: dateToISODate(date1) }
			});
			useStore.getState().addRooms([room]);

			useStore.getState().updateHistory(room.id, [textMessage0, textMessage1]);
			useStore.getState().addCreateRoomMessage(room.id);

			const { messages } = useStore.getState().chatsRegistry[room.id];
			// Messages list: [MESSAGE0, MESSAGE1]
			expect(messages).toHaveLength(2);
			expect(messages[0]).toBe(textMessage0);
		});
	});

	describe('setRepliedMessage', () => {
		const message = createMockTextMessage({ from: 'unknownUserId' });
		const messageReplyToMessage = createMockTextMessage({
			id: 'messageReplyId',
			roomId: message.roomId,
			replyTo: message.id
		});

		test('Reply to a message in the history', () => {
			useStore.getState().updateHistory(message.roomId, [message]);
			useStore.getState().newMessage(messageReplyToMessage);
			useStore.getState().setRepliedMessage(message.roomId, messageReplyToMessage.id, message);

			const { messages } = useStore.getState().chatsRegistry[message.roomId];
			const replied = messages[1] as TextMessage;
			expect(replied.repliedMessage).toBe(message);
		});

		test('Reply to a message not in the history', () => {
			useStore.getState().updateHistory(message.roomId, [messageReplyToMessage]);
			useStore.getState().setRepliedMessage(message.roomId, messageReplyToMessage.id, message);

			const { messages } = useStore.getState().chatsRegistry[message.roomId];
			const replied = messages[0] as TextMessage;
			expect(replied.repliedMessage).toBe(message);
		});
	});

	describe('Placeholder messages', () => {
		const placeholderMessageFields = {
			roomId: 'roomId',
			id: 'placeholderMessageId',
			text: 'placeholderMessageText',
			replyTo: 'replyToMessageId'
		};

		test('Add a placeholder message', () => {
			useStore.getState().setPlaceholderMessage(placeholderMessageFields);

			const { messages } = useStore.getState().chatsRegistry[placeholderMessageFields.roomId];
			const placeholder = last(messages) as TextMessage;
			expect(placeholder.id).toBe('placeholderMessageId');
			expect(placeholder.text).toBe('placeholderMessageText');
			expect(placeholder.replyTo).toBe('replyToMessageId');
		});

		test('Remove a placeholder message', () => {
			useStore.getState().setPlaceholderMessage(placeholderMessageFields);
			useStore
				.getState()
				.removePlaceholderMessage(placeholderMessageFields.roomId, placeholderMessageFields.id);

			const { messages } = useStore.getState().chatsRegistry[placeholderMessageFields.roomId];
			expect(find(messages, { id: placeholderMessageFields.id })).toBeUndefined();
		});

		test('Add placeholder message', () => {
			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().setPlaceholderMessage(placeholderMessageFields);

			const { messages } = useStore.getState().chatsRegistry[placeholderMessageFields.roomId];
			const placeholder = messages[messages.length - 1] as TextMessage;
			expect(placeholder.id).toBe('placeholderMessageId');
			expect(placeholder.text).toBe('placeholderMessageText');
			expect(placeholder.replyTo).toBe('replyToMessageId');
		});

		test('Remove placeholder message and check that date message is not present', () => {
			useStore.getState().updateHistory(newTextMessage.roomId, [textMessage0, textMessage1]);
			useStore.getState().setPlaceholderMessage(placeholderMessageFields);
			useStore
				.getState()
				.removePlaceholderMessage(placeholderMessageFields.roomId, placeholderMessageFields.id);

			const { messages } = useStore.getState().chatsRegistry[placeholderMessageFields.roomId];
			const lastMsg = messages[messages.length - 1];

			expect(messages[messages.length - 2].type).toBe(MessageType.TEXT_MSG);
			expect(lastMsg).toBe(textMessage1);
		});

		test('Arrive a new message to replace the placeholder message', () => {
			useStore.getState().setPlaceholderMessage({
				roomId: newTextMessage.roomId,
				id: newTextMessage.id,
				text: newTextMessage.text
			});
			useStore.getState().newMessage(newTextMessage);

			const { messages } = useStore.getState().chatsRegistry[newTextMessage.roomId];
			expect(messages[0]).toStrictEqual(newTextMessage);
		});
	});

	describe('Fastening', () => {
		test('Adds a new fastening and keeps only unique', () => {
			const fastening = createMockMessageFastening({
				id: 'f1',
				roomId: 'roomF',
				originalStanzaId: 's1',
				date: Date.now(),
				action: FasteningAction.REACTION,
				from: 'userA'
			});

			useStore.getState().addFastening([fastening]);
			useStore.getState().addFastening([fastening]); // duplicate

			const fastenings =
				useStore.getState().chatsRegistry[fastening.roomId].fastenings[fastening.originalStanzaId];
			expect(fastenings).toHaveLength(1);
		});

		test('Orders fastenings by date', () => {
			const f1 = createMockMessageFastening({
				id: 'f1',
				originalStanzaId: 's1',
				date: 1,
				from: 'a',
				action: FasteningAction.REACTION
			});
			const f2 = createMockMessageFastening({
				id: 'f2',
				originalStanzaId: 's1',
				date: 2,
				from: 'b',
				action: FasteningAction.REACTION
			});
			useStore.getState().addFastening([f2]);
			useStore.getState().addFastening([f1]);

			const fastenings = useStore.getState().chatsRegistry[f1.roomId].fastenings.s1;
			expect(fastenings[0].id).toBe('f1');
			expect(fastenings[1].id).toBe('f2');
		});
	});

	describe('updateReadStatus', () => {
		test('New marker: message read property changes', () => {
			const room = createMockRoom({
				id: 'roomIdTest',
				members: [createMockMember({ userId: 'userId1' }), createMockMember({ userId: 'userId2' })]
			});
			const msg = createMockTextMessage({
				id: 'm1',
				date: dateToTimestamp('2024-05-01 12:30'),
				roomId: room.id
			});
			const marker = createMockMarker({
				from: 'userId1',
				markerDate: msg.date,
				messageId: msg.id
			});

			useStore.getState().addRooms([room]);
			useStore.getState().updateHistory(msg.roomId, [msg]);
			useStore.getState().updateReadStatus(msg.roomId, [marker]);

			const { messages, markers } = useStore.getState().chatsRegistry[msg.roomId];
			expect(markers[marker.from]).toStrictEqual(marker);
			expect((messages[0] as TextMessage).read).not.toBe(MarkerStatus.UNREAD);
		});
	});

	describe('Unread count', () => {
		test('Increments unread counter', () => {
			const roomId = 'room1';
			useStore.getState().incrementUnreadCount(roomId, 3);
			useStore.getState().incrementUnreadCount(roomId, 2);

			const { unread } = useStore.getState().chatsRegistry[roomId];
			expect(unread).toBe(5);
		});

		test('incrementUnreadCount - initializes if undefined', () => {
			const roomId = 'roomUnreadInit';
			useStore.getState().incrementUnreadCount(roomId, 1);
			expect(useStore.getState().chatsRegistry[roomId].unread).toBe(1);
		});
	});

	describe('Search messages', () => {
		test('Store search messages', () => {
			const roomId = 'searchRoom1';
			const searchMessages = [
				createMockTextMessage({ id: 'msgId1', roomId, text: 'Hello' }),
				createMockTextMessage({ id: 'msgId2', roomId, text: 'World' })
			];
			useStore.getState().setSearchResults(roomId, searchMessages);
			expect(useStore.getState().chatsRegistry[roomId].searchResults).toHaveLength(2);
		});

		test('Clear search messages', () => {
			const roomId = 'searchRoom2';
			const searchMessages = [
				createMockTextMessage({ id: 'msgId3', roomId, text: 'Foo' }),
				createMockTextMessage({ id: 'msgId4', roomId, text: 'Bar' })
			];
			const store = useStore.getState();
			store.setSearchResults(roomId, searchMessages);
			store.setSelectedSearchResult(roomId, searchMessages[0].stanzaId);
			store.clearSearchResults(roomId);
			expect(useStore.getState().chatsRegistry[roomId].searchResults).toHaveLength(0);
			expect(useStore.getState().activeConversations[roomId]?.selectedSearchResult).toBeUndefined();
		});
	});

	describe('addMessageRange', () => {
		test('Adding two ranges with gap', () => {
			const range1: MessageRange = {
				oldestId: 'msg1',
				oldestTimestamp: 1000,
				newestId: 'msg10',
				newestTimestamp: 2000
			};
			const range2: MessageRange = {
				oldestId: 'msg8',
				oldestTimestamp: 2500,
				newestId: 'msg20',
				newestTimestamp: 3000
			};
			useStore.getState().addMessageRange('roomId', range2);
			useStore.getState().addMessageRange('roomId', range1);
			const ranges = useStore.getState().chatsRegistry.roomId.messageRanges;
			expect(ranges).toHaveLength(2);
			expect(ranges?.[0]).toEqual(range1);
			expect(ranges?.[1]).toEqual(range2);
		});

		test('Merge overlapping ranges', () => {
			const range1: MessageRange = {
				oldestId: 'msg1',
				oldestTimestamp: 1000,
				newestId: 'msg10',
				newestTimestamp: 2000
			};
			const range2: MessageRange = {
				oldestId: 'msg8',
				oldestTimestamp: 1800,
				newestId: 'msg20',
				newestTimestamp: 3000
			};
			useStore.getState().addMessageRange('roomId', range2);
			useStore.getState().addMessageRange('roomId', range1);
			const ranges = useStore.getState().chatsRegistry.roomId.messageRanges;
			expect(ranges).toHaveLength(1);
			expect(ranges?.[0].newestTimestamp).toBe(range2.newestTimestamp);
			expect(ranges?.[0].oldestTimestamp).toBe(range1.oldestTimestamp);
		});
	});

	describe('Backfill queue', () => {
		test('Do not add duplicate backfill requests', () => {
			const roomId = 'room3';
			const request: BackfillRequest = {
				afterDate: date1,
				beforeDate: date2
			};
			useStore.getState().enqueueBackfill(roomId, [request]);
			useStore.getState().enqueueBackfill(roomId, [request]);

			const { backfillQueue } = useStore.getState().chatsRegistry[roomId];
			expect(backfillQueue).toHaveLength(1);
		});

		test('Remove first request from queue', () => {
			const roomId = 'room4';
			const request1: BackfillRequest = {
				afterDate: date1,
				beforeDate: date2
			};
			const request2: BackfillRequest = {
				afterDate: date2,
				beforeDate: date3
			};

			useStore.getState().enqueueBackfill(roomId, [request1, request2]);
			useStore.getState().shiftBackfillQueue(roomId);

			const { backfillQueue } = useStore.getState().chatsRegistry[roomId];
			expect(backfillQueue).toHaveLength(1);
			expect(backfillQueue[0]).toEqual(request2);
		});
	});
});
