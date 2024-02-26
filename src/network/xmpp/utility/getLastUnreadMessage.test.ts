/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getLastUnreadMessage } from './getLastUnreadMessage';
import useStore from '../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockMarker,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { dateToTimestamp } from '../../../utils/dateUtils';

const sessionUser = createMockUser({ id: 'userId', name: 'User' });
const user1 = createMockUser({ id: 'user1', name: 'User1' });
const room = createMockRoom();

const markedMessage = createMockTextMessage({
	id: 'markedMessage',
	roomId: room.id,
	from: user1.id,
	date: dateToTimestamp(new Date('2024-02-19T15:25:00.961+02:00'))
});
const myMarker = createMockMarker({
	roomId: room.id,
	from: sessionUser.id,
	messageId: markedMessage.id
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.addRoom(room);
});
describe('getLastUnreadMessage', () => {
	describe('Session user has never read any message in the conversation', () => {
		test('No messages in the conversation', () => {
			const lastUnreadMessage = getLastUnreadMessage(room.id);
			expect(lastUnreadMessage).toBeUndefined();
		});

		test('Conversation has been created', () => {
			const message = createMockConfigurationMessage({
				id: 'roomCreation',
				roomId: room.id,
				ROOM_CREATION: 'roomCreation'
			});
			const store = useStore.getState();
			store.newMessage(message);

			expect(getLastUnreadMessage(room.id)).toBe(message.id);
		});

		test('Conversation has only the inbox message sent by me', () => {
			const message = createMockTextMessage({ roomId: room.id, from: sessionUser.id });
			const store = useStore.getState();
			store.newInboxMessage(message);

			expect(getLastUnreadMessage(room.id)).toBe(undefined);
		});

		test('Conversation has only the inbox message sent by another user', () => {
			const message = createMockTextMessage({ roomId: room.id, from: user1.id });
			const store = useStore.getState();
			store.newInboxMessage(message);

			expect(getLastUnreadMessage(room.id)).toBe(message.id);
		});

		test('Conversation has only text messages sent by me', () => {
			const message1 = createMockTextMessage({
				roomId: room.id,
				id: 'message1',
				from: sessionUser.id
			});
			const message2 = createMockTextMessage({
				roomId: room.id,
				id: 'message2',
				from: sessionUser.id
			});
			const message3 = createMockTextMessage({
				roomId: room.id,
				id: 'message2',
				from: sessionUser.id
			});
			const store = useStore.getState();
			store.updateHistory(room.id, [message1, message2, message3]);

			expect(getLastUnreadMessage(room.id)).toBe(undefined);
		});

		test('Conversation has only text messages sent by others', () => {
			const message1 = createMockTextMessage({ roomId: room.id, id: 'message1', from: user1.id });
			const message2 = createMockTextMessage({ roomId: room.id, id: 'message3', from: user1.id });
			const message3 = createMockTextMessage({ roomId: room.id, id: 'message3', from: user1.id });
			const store = useStore.getState();
			store.updateHistory(room.id, [message1, message2, message3]);

			expect(getLastUnreadMessage(room.id)).toBe(message3.id);
		});

		test('Conversation has text messages sent by others and me', () => {
			const message1 = createMockTextMessage({ roomId: room.id, from: user1.id });
			const message2 = createMockTextMessage({ roomId: room.id, from: sessionUser.id });
			const message3 = createMockTextMessage({ roomId: room.id, from: user1.id });
			const store = useStore.getState();
			store.updateHistory(room.id, [message1, message2, message3]);

			expect(getLastUnreadMessage(room.id)).toBe(message3.id);
		});
	});

	describe('Session user has already read some messages in the conversation', () => {
		test('Last message is read by me', () => {
			const message1 = createMockTextMessage({
				id: 'message1',
				roomId: room.id,
				from: user1.id,
				date: dateToTimestamp(new Date('2024-02-19T15:20:00.961+02:00'))
			});
			const store = useStore.getState();
			store.updateHistory(room.id, [message1, markedMessage]);
			store.updateMarkers(room.id, [myMarker]);

			expect(getLastUnreadMessage(room.id)).toBe(undefined);
		});

		test('Last message is not read by me', () => {
			const message1 = createMockTextMessage({
				id: 'message1',
				roomId: room.id,
				from: user1.id,
				date: dateToTimestamp(new Date('2024-02-19T15:20:00.961+02:00'))
			});
			const message2 = createMockTextMessage({
				id: 'message2',
				roomId: room.id,
				from: user1.id,
				date: dateToTimestamp(new Date('2024-02-19T15:35:00.961+02:00'))
			});
			const store = useStore.getState();
			store.updateHistory(room.id, [message1, markedMessage, message2]);
			store.updateMarkers(room.id, [myMarker]);

			expect(getLastUnreadMessage(room.id)).toBe(message2.id);
		});
	});
});
