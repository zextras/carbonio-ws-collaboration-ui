/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import {
	createMockAffiliationMessage,
	createMockMarker,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../tests/createMock';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import { MessageType, TextMessage } from '../../types/store/MessageTypes';
import { dateToTimestamp } from '../../utils/dateUtil';
import useStore from '../Store';

describe('Test messages slice - newMessage', () => {
	test('Arrive a text message as first', () => {
		const newMessage = createMockTextMessage();
		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(newMessage));
		expect(result.current.messages[newMessage.roomId]).not.toBeNull();
		expect(result.current.messages[newMessage.roomId]).toHaveLength(2);

		// Messages list: [DATE, NEW MESSAGE]
		expect(result.current.messages[newMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[newMessage.roomId][1]).toBe(newMessage);
	});

	test('Arrive a text message in a conversation already full of messages of the same day', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const newMessage = createMockTextMessage({
			id: 'newMessage',
			date: dateToTimestamp('2023-05-01 14:02')
		});

		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(newMessage.roomId, [message0, message1]);
			result.current.newMessage(newMessage);
		});

		const { messages } = result.current;
		// Messages list: [DATE, MESSAGE0, MESSAGE1, NEW MESSAGE]
		expect(messages[newMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(messages[newMessage.roomId][1]).toBe(message0);
		expect(messages[newMessage.roomId][2]).toBe(message1);
		expect(messages[newMessage.roomId][3]).toBe(newMessage);
	});

	test('Arrive a text message in a conversation already full of messages of the another day', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const newMessage = createMockTextMessage({
			id: 'newMessage',
			date: dateToTimestamp('2023-05-02 10:00')
		});

		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(newMessage.roomId, [message0, message1]);
			result.current.newMessage(newMessage);
		});

		const { messages } = result.current;
		// Messages list: [DATE, MESSAGE0, MESSAGE1, DATE, NEW MESSAGE]
		expect(messages[newMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(messages[newMessage.roomId][1]).toBe(message0);
		expect(messages[newMessage.roomId][2]).toBe(message1);
		expect(messages[newMessage.roomId][3].type).toBe(MessageType.DATE_MSG);
		expect(messages[newMessage.roomId][4]).toBe(newMessage);
	});

	test('Arrive an affiliate message as first', () => {
		const newMessage = createMockAffiliationMessage();
		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(newMessage));
		expect(result.current.messages[newMessage.roomId]).not.toBeNull();
		expect(result.current.messages[newMessage.roomId]).toHaveLength(2);

		// Messages list: [DATE, NEW MESSAGE]
		expect(result.current.messages[newMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[newMessage.roomId][1]).toBe(newMessage);
	});

	test('Arrive a message forwarded from an unknown user', () => {
		const newMessage = createMockTextMessage({
			from: 'userId',
			forwarded: {
				id: 'forwardedMessageId',
				date: 12312312312,
				from: 'unknownUserId',
				text: 'hi!'
			}
		});
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo(createMockUser({ id: 'userId' }));
			result.current.newMessage(newMessage);
		});

		jest.advanceTimersByTime(1000);
		expect(fetch).toBeCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			`/services/chats/users?userIds=unknownUserId`,
			expect.anything()
		);
	});

	test('Arrive an affiliation message from an unknown user', () => {
		const newMessage = createMockAffiliationMessage({
			userId: 'unknownUserId'
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.newMessage(newMessage));

		jest.advanceTimersByTime(1000);
		expect(fetch).toBeCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			`/services/chats/users?userIds=unknownUserId`,
			expect.anything()
		);
	});
});

describe('Test messages slice - newInboxMessage', () => {
	test('Arrive an inbox text message', () => {
		const inboxMessage = createMockTextMessage();
		const { result } = renderHook(() => useStore());
		act(() => result.current.newInboxMessage(inboxMessage));
		expect(result.current.messages[inboxMessage.roomId]).not.toBeNull();
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(2);

		// Messages list: [DATE, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[inboxMessage.roomId][1]).toBe(inboxMessage);
	});

	test('Arrive an inbox text message after a history request (also with different date)', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const inboxMessage = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01:01')
		});
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(message0.roomId, [message0, message1]);
			result.current.newInboxMessage(message1);
			result.current.newInboxMessage(inboxMessage);
		});

		// Messages list: [DATE, MESSAGE0, MESSAGE1]]
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(3);
		// expect(result.current.messages[inboxMessage.roomId][1]).toBe(inboxMessage);
		// expect(result.current.messages[inboxMessage.roomId][1]).toBe(inboxMessage);
		// expect(result.current.messages[inboxMessage.roomId][1]).toBe(inboxMessage);
	});

	test('Arrive an inbox message of a room in which history is been cleared before message date', () => {
		const room = createMockRoom({
			userSettings: {
				clearedAt: dateToTimestamp('2023-05-01 12:00')
			}
		});
		const inboxMessage = createMockTextMessage({
			roomId: room.id,
			date: dateToTimestamp('2023-05-01 13:00')
		});
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.newInboxMessage(inboxMessage);
		});

		// Messages list: [DATE, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId][1]).toBe(inboxMessage);
	});

	test('Arrive an inbox message of a room in which history is been cleared after message date', () => {
		const room = createMockRoom({
			userSettings: {
				clearedAt: dateToTimestamp('2023-05-01 14:00')
			}
		});
		const inboxMessage = createMockTextMessage({
			roomId: room.id,
			date: dateToTimestamp('2023-05-01 13:00')
		});
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.newInboxMessage(inboxMessage);
		});

		// Messages list: []
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(0);
	});
});

describe('Test messages slice - updateHistory', () => {
	test('First update history after an inbox message (inbox message and last history message are from the same day)', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const inboxMessage = createMockTextMessage({
			id: 'newMessage',
			date: dateToTimestamp('2023-05-01 14:02')
		});
		const { result } = renderHook(() => useStore());

		act(() => {
			result.current.newInboxMessage(inboxMessage);
			result.current.updateHistory(inboxMessage.roomId, [message0, message1]);
		});

		// Messages list: [DATE, MESSAGE0, MESSAGE1, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(4);
		expect(result.current.messages[inboxMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[inboxMessage.roomId][1]).toBe(message0);
		expect(result.current.messages[inboxMessage.roomId][2]).toBe(message1);
		expect(result.current.messages[inboxMessage.roomId][3]).toBe(inboxMessage);
	});

	test("First update history after an inbox message (inbox message and last history message AREN'T from the same day)", () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const inboxMessage = createMockTextMessage({
			id: 'newMessage',
			date: dateToTimestamp('2023-05-02 10:00')
		});
		const { result } = renderHook(() => useStore());

		act(() => {
			result.current.newInboxMessage(inboxMessage);
			result.current.updateHistory(inboxMessage.roomId, [message0, message1]);
		});

		// Messages list: [DATE, MESSAGE0, MESSAGE1, DATE, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(5);
		expect(result.current.messages[inboxMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[inboxMessage.roomId][1]).toBe(message0);
		expect(result.current.messages[inboxMessage.roomId][2]).toBe(message1);
		expect(result.current.messages[inboxMessage.roomId][3].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[inboxMessage.roomId][4]).toBe(inboxMessage);
	});

	test('Last message of history is the inbox message', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const inboxMessage = createMockTextMessage({
			id: 'newMessage',
			date: dateToTimestamp('2023-05-01 14:04')
		});
		const { result } = renderHook(() => useStore());

		act(() => {
			result.current.newInboxMessage(inboxMessage);
			result.current.updateHistory(inboxMessage.roomId, [message0, inboxMessage]);
		});

		// Messages list: [DATE, MESSAGE0, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(3);
		expect(result.current.messages[inboxMessage.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[inboxMessage.roomId][1]).toBe(message0);
		expect(result.current.messages[inboxMessage.roomId][2]).toBe(inboxMessage);
	});

	test('Last message of history is the inbox message (but dates are not the same)', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:04:00')
		});
		const inboxMessage = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:04:01')
		});
		const { result } = renderHook(() => useStore());

		act(() => {
			result.current.newInboxMessage(inboxMessage);
			result.current.updateHistory(inboxMessage.roomId, [message0, message1]);
		});

		// Messages list: [DATE, MESSAGE0, INBOX MESSAGE]
		expect(result.current.messages[inboxMessage.roomId]).toHaveLength(3);
	});

	test('In the history response there are messages from different date', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-03 09:01')
		});
		const message2 = createMockTextMessage({
			id: 'message2',
			date: dateToTimestamp('2023-05-05 20:02')
		});
		const { result } = renderHook(() => useStore());

		act(() => {
			result.current.updateHistory(message0.roomId, [message0, message1, message2]);
		});

		// Messages list: [DATE, MESSAGE0, DATE, MESSAGE1, DATE, MESSAGE2]
		expect(result.current.messages[message0.roomId]).toHaveLength(6);
		expect(result.current.messages[message0.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][1]).toBe(message0);
		expect(result.current.messages[message0.roomId][2].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][3]).toBe(message1);
		expect(result.current.messages[message0.roomId][4].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][5]).toBe(message2);
	});

	test('Load a history after another history', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateHistory(message0.roomId, [message0, message1]));

		// Messages list: [DATE, MESSAGE0, MESSAGE1]
		expect(result.current.messages[message0.roomId]).toHaveLength(3);
		expect(result.current.messages[message0.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][1]).toBe(message0);
		expect(result.current.messages[message0.roomId][2]).toBe(message1);

		const message2 = createMockTextMessage({
			id: 'message2',
			date: dateToTimestamp('2023-04-30 20:00')
		});
		const message3 = createMockTextMessage({
			id: 'message3',
			date: dateToTimestamp('2023-05-01 13:59')
		});
		act(() => result.current.updateHistory(message0.roomId, [message2, message3]));

		// Messages list: [DATE, MESSAGE2, DATE, MESSAGE3, MESSAGE0, MESSAGE1]
		expect(result.current.messages[message0.roomId]).toHaveLength(6);
		expect(result.current.messages[message0.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][1]).toBe(message2);
		expect(result.current.messages[message0.roomId][2].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][3]).toBe(message3);
		expect(result.current.messages[message0.roomId][4]).toBe(message0);
		expect(result.current.messages[message0.roomId][5]).toBe(message1);
	});

	test('Arrive an history already loaded', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			date: dateToTimestamp('2023-05-01 14:00')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			date: dateToTimestamp('2023-05-01 14:01')
		});
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(message0.roomId, [message0, message1]);
			result.current.updateHistory(message0.roomId, [message0, message1]);
			result.current.updateHistory(message0.roomId, [message1]);
		});

		// Messages list: [DATE, MESSAGE0, MESSAGE1]
		expect(result.current.messages[message0.roomId]).toHaveLength(3);
		expect(result.current.messages[message0.roomId][0].type).toBe(MessageType.DATE_MSG);
		expect(result.current.messages[message0.roomId][1]).toBe(message0);
		expect(result.current.messages[message0.roomId][2]).toBe(message1);
	});
});

describe('Test message slice - updateUnreadMessages', () => {
	const room = createMockRoom({
		userSettings: { clearedAt: '2022-08-26T19:14:54.393Z' }, // 26 ago 2022, 19:14:54
		members: [
			createMockMember({ userId: 'user0' }),
			createMockMember({ userId: 'user1' }),
			createMockMember({ userId: 'user2' })
		]
	});

	const message0 = createMockTextMessage({
		id: 'message0-id',
		date: dateToTimestamp('2022-08-25 15:28:14'),
		from: 'user0'
	});

	const message1 = createMockTextMessage({
		id: 'message1-id',
		roomId: room.id,
		date: dateToTimestamp('2022-09-07 09:01:34'),
		from: 'user1'
	});

	const marker0_user0 = createMockMarker({
		from: 'user0',
		messageId: message0.id,
		markerDate: 1662541295393
	});

	const marker0_user1 = createMockMarker({
		from: 'user1',
		messageId: message0.id,
		markerDate: 1662541295393
	});

	const marker0_user2 = createMockMarker({
		from: 'user2',
		messageId: message0.id,
		markerDate: 1662541296393
	});

	const marker1_user0 = createMockMarker({
		from: 'user0',
		messageId: message1.id,
		markerDate: 1662541297393
	});

	const marker1_user1 = createMockMarker({
		from: 'user1',
		messageId: message1.id,
		markerDate: 1662541297393
	});

	test('Tests updateUnreadMessages', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		// Message list: [DATE, MESSAGE0, DATE, MESSAGE1]
		act(() => result.current.updateHistory(room.id, [message0, message1]));

		// Simulation of onNewMessageStanza method: user0 send an ack of his own message0
		act(() => result.current.updateMarkers([marker0_user0], room.id));

		let storedMessage0;
		let storedMessage1;
		// user1 reads message0
		act(() => result.current.updateMarkers([marker0_user1], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		storedMessage0 = result.current.messages[room.id][1] as TextMessage;
		expect(storedMessage0.read).toBe(MarkerStatus.READ_BY_SOMEONE);
		storedMessage1 = result.current.messages[room.id][3] as TextMessage;
		expect(storedMessage1.read).toBe(MarkerStatus.UNREAD);

		// user2 reads message0
		act(() => result.current.updateMarkers([marker0_user2], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		storedMessage0 = result.current.messages[room.id][1] as TextMessage;
		expect(storedMessage0.read).toBe(MarkerStatus.READ);
		storedMessage1 = result.current.messages[room.id][3] as TextMessage;
		expect(storedMessage1.read).toBe(MarkerStatus.UNREAD);

		// user1 after sent the message set as read it to simulate the onNewMessageStanza method
		act(() => result.current.updateMarkers([marker1_user1], room.id));

		// user0 reads message1
		act(() => result.current.updateMarkers([marker1_user0], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		storedMessage0 = result.current.messages[room.id][1] as TextMessage;
		expect(storedMessage0.read).toBe(MarkerStatus.READ);
		storedMessage1 = result.current.messages[room.id][3] as TextMessage;
		expect(storedMessage1.read).toBe(MarkerStatus.READ_BY_SOMEONE);
	});
});

describe('Test message slice - setRepliedMessage', () => {
	const message = createMockTextMessage({ from: 'unknownUserId' });
	const messageReplyToMessage = createMockTextMessage({
		id: 'messageReplyId',
		roomId: message.roomId,
		replyTo: message.id
	});

	test('Reply to a message in the history', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.updateHistory(message.roomId, [message]));
		act(() => {
			result.current.newMessage(messageReplyToMessage);
			result.current.setRepliedMessage(message.roomId, messageReplyToMessage.id, message);
		});

		const textMessage = result.current.messages[message.roomId][2] as TextMessage;
		expect(textMessage.repliedMessage).toBe(message);
	});

	test('Reply to a message not in the history', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.updateHistory(message.roomId, [messageReplyToMessage]);
			result.current.setRepliedMessage(message.roomId, messageReplyToMessage.id, message);
		});

		const textMessage = result.current.messages[message.roomId][1] as TextMessage;
		expect(textMessage.repliedMessage).toBe(message);
	});

	test('Reply to a message to one in which from user is unknown', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo(createMockUser({ id: messageReplyToMessage.from }));
			result.current.updateHistory(message.roomId, [messageReplyToMessage]);
			result.current.setRepliedMessage(message.roomId, messageReplyToMessage.id, message);
		});

		jest.advanceTimersByTime(1000);
		expect(global.fetch).toBeCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith(
			`/services/chats/users?userIds=unknownUserId`,
			expect.anything()
		);
	});
});
