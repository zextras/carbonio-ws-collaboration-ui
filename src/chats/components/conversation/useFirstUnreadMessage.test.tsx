/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';
import { last, size } from 'lodash';

import useFirstUnreadMessage from './useFirstUnreadMessage';
import useStore from '../../../store/Store';
import { createMockMarker, createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { MessageType } from '../../../types/store/MessageTypes';
import { dateToTimestamp } from '../../../utils/dateUtils';

const myUserId = 'myUserId';
const room = createMockRoom();

const textHistory = [
	createMockTextMessage({
		id: 'messageId0',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:00'))
	}),
	createMockTextMessage({
		id: 'messageId1',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:01'))
	}),
	createMockTextMessage({
		id: 'messageId2',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:02'))
	}),
	createMockTextMessage({
		id: 'messageId3',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:03'))
	}),
	createMockTextMessage({
		id: 'messageId4',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:04'))
	}),
	createMockTextMessage({
		id: 'messageId5',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:05'))
	})
];

const complexHistory = [
	createMockTextMessage({
		id: 'messageId0',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:00'))
	}),
	createMockTextMessage({
		id: 'messageId1',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:01')),
		from: myUserId
	}),
	createMockTextMessage({
		id: 'messageId2',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:02')),
		deleted: true
	}),
	createMockTextMessage({
		id: 'messageId3',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:03'))
	}),
	createMockTextMessage({
		id: 'messageId4',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:04')),
		type: MessageType.CONFIGURATION_MSG
	}),
	createMockTextMessage({
		id: 'messageId5',
		roomId: room.id,
		date: dateToTimestamp(new Date('01 May 2023 14:05')),
		from: myUserId
	})
];

describe('useFirstUnreadMessage with text messages', () => {
	beforeEach(() => {
		const store = useStore.getState();
		store.setLoginInfo(myUserId, 'User');
		store.addRoom(room);
		store.updateHistory(room.id, textHistory);
	});
	test('User has never read a message', () => {
		// Update unread
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(size(textHistory));
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		// the reference should be the firs text message arrived
		expect(result.current).toBeUndefined();
	});

	test('User some messages', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({ from: myUserId, messageId: 'messageId3' });
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(2);
		// Check customHook result
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('messageId4');
	});

	test('User reads all messages', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({
			from: myUserId,
			messageId: last(textHistory)?.id || ''
		});
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(0);
		// Check customHook result
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('noUnread');
	});

	test('Reading a message after first access', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({ from: myUserId, messageId: 'messageId2' });
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(3);
		// Check customHook result
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('messageId3');
	});
});

describe('useFirstUnreadMessage with all types of messages', () => {
	beforeEach(() => {
		const store = useStore.getState();
		store.setLoginInfo(myUserId, 'User');
		store.addRoom(room);
		store.updateHistory(room.id, complexHistory);
	});
	test('User has never read a message', () => {
		// Update unread
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(4);
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBeUndefined();
	});

	test('User last read is his message and after there is a deleted message', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({ from: myUserId, messageId: 'messageId1' });
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(3);
		// Check customHook result, deleted is set as message to read
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('messageId2');
	});

	test('User reads all messages, last is mine', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({
			from: myUserId,
			messageId: last(complexHistory)?.id || ''
		});
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(0);
		// Check customHook result
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('noUnread');
	});

	test('Reading a message before a configuration message', () => {
		// Mark last message as read
		const myLastMarker = createMockMarker({ from: myUserId, messageId: 'messageId3' });
		useStore.getState().updateMarkers(room.id, [myLastMarker]);
		useStore.getState().updateUnreadMessages(room.id);
		useStore.getState().updateUnreadCount(room.id);
		// Check number unread
		expect(useStore.getState().unreads[room.id]).toBe(1);
		// Check customHook result
		const { result } = renderHook(() => useFirstUnreadMessage(room.id));
		expect(result.current).toBe('messageId4');
	});
});
