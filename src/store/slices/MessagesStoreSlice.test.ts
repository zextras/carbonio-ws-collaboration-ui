/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import {
	createMockDeletedMessage,
	createMockMarker,
	createMockMember,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import { DeletedMessage, MessageType, TextMessage } from '../../types/store/MessageTypes';
import useStore from '../Store';

const room: RoomBe = createMockRoom({
	id: 'room-id',
	userSettings: { clearedAt: '2022-08-26T19:14:54.393Z' }, // 26 ago 2022, 19:14:54
	members: [
		createMockMember({ userId: 'user0' }),
		createMockMember({ userId: 'user1' }),
		createMockMember({ userId: 'user2' })
	]
});

const room2: RoomBe = createMockRoom();

const message0 = createMockTextMessage({
	id: 'message0-id',
	roomId: room.id,
	date: 1661441294393, // 25 ago 2022, 15:28:14
	from: 'user0'
});

const message1 = createMockTextMessage({
	id: 'message1-id',
	roomId: room.id,
	date: 1662541294393, // 7 set 2022, 09:01:34
	from: 'user1'
});

const message2 = createMockTextMessage({
	id: 'message2-id',
	roomId: room.id,
	date: 1662541394393 // 7 set 2022, 09:03:14
});

const message0ReplyToMessage0 = createMockTextMessage({
	id: 'message-reply0-id',
	roomId: room.id,
	date: 1665441294393,
	from: 'user0'
});

const message1ReplyToMessage1 = createMockTextMessage({
	id: 'message-reply1-id',
	roomId: room.id,
	date: 1665441294393,
	from: 'user0'
});

const deletedMessage0: DeletedMessage = createMockDeletedMessage({
	id: 'message0-id',
	roomId: room.id,
	date: 1661441294393, // 25 ago 2022, 15:28:14
	from: 'user0'
});

const deletedMessage1: DeletedMessage = createMockDeletedMessage({
	id: 'message1-id',
	roomId: room.id,
	date: 1662541294393, // 7 set 2022, 09:01:34
	from: 'user1'
});

const message0Correction = createMockTextMessage({
	id: message0.id,
	roomId: room.id,
	date: 1665441294393,
	from: 'user0',
	text: 'edited message n0',
	edited: true
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

describe('Test messages slice', () => {
	// remember that when a message is sent in a date that is different from the previous one, there will be a date message between these messages
	it('Tests newMessage', () => {
		const { result } = renderHook(() => useStore());
		// Add first message
		act(() => result.current.newMessage(message0));
		expect(result.current.messages[message0.roomId]).not.toBeNull();
		expect(result.current.messages[message0.roomId]).toHaveLength(2);
		expect(result.current.messages[message0.roomId][1]).toBe(message0);

		// Add a second message
		act(() => result.current.newMessage(message1));
		expect(result.current.messages[message1.roomId]).toHaveLength(4);
		expect(result.current.messages[message1.roomId][3]).toBe(message1);
	});

	it('Tests newInboxMessage', () => {
		const { result } = renderHook(() => useStore());
		// inbox message before loading room info
		act(() => result.current.newInboxMessage(message0));
		expect(result.current.messages[message0.roomId]).not.toBeNull();
		expect(result.current.messages[message0.roomId]).toHaveLength(1);
		expect(result.current.messages[message0.roomId][0]).toBe(message0);
	});

	it('Tests newInboxMessage with clearedAt', () => {
		const { result } = renderHook(() => useStore());
		// clearedAt date is after message date
		act(() => result.current.addRoom(room));
		act(() => result.current.newInboxMessage(message0));
		expect(result.current.messages[message0.roomId]).toHaveLength(0);

		// clearedAt date is before message date
		act(() => result.current.newInboxMessage(message1));
		expect(result.current.messages[message1.roomId]).toHaveLength(1);
	});

	it('Tests updateHistory', () => {
		const { result } = renderHook(() => useStore());
		// Add first message
		act(() => result.current.updateHistory(message0.roomId, [message0, message1]));
		expect(result.current.messages[message0.roomId]).toHaveLength(4);

		// Insert new messages in the center of history
		act(() => result.current.updateHistory(message0.roomId, [message2]));
		expect(result.current.messages[message0.roomId]).toHaveLength(6);
		expect(result.current.messages[message0.roomId][1]).toBe(message0);
		expect(result.current.messages[message0.roomId][3]).toBe(message1);
		expect(result.current.messages[message0.roomId][5]).toBe(message2);

		// Insert message with same id of another
		act(() => result.current.updateHistory(message0.roomId, [message2]));
		expect(result.current.messages[message0.roomId]).toHaveLength(8);
	});

	it('Tests updateUnreadMessages', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));

		// user0 after sent the message set as read it to simulate the onNewMessageStanza method
		act(() => result.current.updateMarkers([marker0_user0], room.id));

		// user1 reads message0
		act(() => result.current.updateMarkers([marker0_user1], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		expect((result.current.messages[room.id][1] as TextMessage).read).toBe(
			MarkerStatus.READ_BY_SOMEONE
		);
		expect((result.current.messages[room.id][3] as TextMessage).read).toBe(MarkerStatus.UNREAD);

		// user2 reads message0
		act(() => result.current.updateMarkers([marker0_user2], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		expect((result.current.messages[room.id][1] as TextMessage).read).toBe(MarkerStatus.READ);
		expect((result.current.messages[room.id][3] as TextMessage).read).toBe(MarkerStatus.UNREAD);

		// user1 after sent the message set as read it to simulate the onNewMessageStanza method
		act(() => result.current.updateMarkers([marker1_user1], room.id));

		// user0 reads message1
		act(() => result.current.updateMarkers([marker1_user0], room.id));
		act(() => result.current.updateUnreadMessages(room.id));
		expect((result.current.messages[room.id][1] as TextMessage).read).toBe(MarkerStatus.READ);
		expect((result.current.messages[room.id][3] as TextMessage).read).toBe(
			MarkerStatus.READ_BY_SOMEONE
		);
	});

	it('Tests setRepliedMessage', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.addRoom(room2));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));
		act(() => result.current.newMessage(message0ReplyToMessage0));
		act(() => result.current.newMessage(message1ReplyToMessage1));
		act(() => result.current.setRepliedMessage(room.id, message0ReplyToMessage0.id, message0));
		expect((result.current.messages[room.id][5] as TextMessage).repliedMessage).toBe(message0);
		act(() => result.current.setRepliedMessage(room.id, message1ReplyToMessage1.id, message1));
		expect((result.current.messages[room.id][6] as TextMessage).repliedMessage).toBe(message1);
	});

	it('Tests setDeletedMessage', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.addRoom(room2));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));
		act(() => result.current.setDeletedMessage(room.id, deletedMessage0));
		expect(result.current.messages[room.id][1].type).toBe(MessageType.DELETED_MSG);
		expect(result.current.messages[room.id][1]).toStrictEqual(deletedMessage0);
		act(() => result.current.newMessage(deletedMessage1));
	});

	it('Tests setEditedMessage', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));
		act(() => result.current.setEditedMessage(room.id, message0Correction as TextMessage));
		expect((result.current.messages[room.id][1] as TextMessage).edited).toBeTruthy();
		expect(result.current.messages[room.id][1].date).toBe(message0.date);
		expect((result.current.messages[room.id][1] as TextMessage).text).toBe(message0Correction.text);
	});

	it('test reply of a edited message', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));
		act(() => result.current.setEditedMessage(room.id, message0Correction as TextMessage));
		act(() => result.current.newMessage(message0ReplyToMessage0));
		act(() => result.current.setRepliedMessage(room.id, message0ReplyToMessage0.id, message0));
		expect((result.current.messages[room.id][5] as TextMessage).repliedMessage?.id).toBe(
			message0.id
		);
		expect(
			((result.current.messages[room.id][5] as TextMessage).repliedMessage as TextMessage)?.text
		).toBe(message0Correction.text);
	});

	it('test reply of a deleted message', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		act(() => result.current.newMessage(message0));
		act(() => result.current.newMessage(message1));
		act(() => result.current.newMessage(message0ReplyToMessage0));
		act(() => result.current.setDeletedMessage(room.id, deletedMessage0));
		act(() => result.current.setRepliedMessage(room.id, message0ReplyToMessage0.id, message0));
		expect((result.current.messages[room.id][5] as TextMessage).repliedMessage?.id).toBe(
			message0.id
		);
		expect(
			((result.current.messages[room.id][5] as TextMessage).repliedMessage as DeletedMessage)?.type
		).toBe(MessageType.DELETED_MSG);
	});
});
