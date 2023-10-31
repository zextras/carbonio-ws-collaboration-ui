/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import displayMessageBrowserNotification from './displayMessageBrowserNotification';
import { mockNotify } from '../../../../__mocks__/@zextras/carbonio-shell-ui';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockRoom,
	createMockTextMessage
} from '../../../tests/createMock';

const room = createMockRoom();

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('userId', 'User');
	store.addRoom(room);
});
describe('Test display message browser notification', () => {
	test('Send desktop notification on new message', () => {
		const newMessage = createMockTextMessage({ roomId: room.id, from: 'userId1' });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).toBeCalled();
	});

	test('Avoid sending desktop notification on my message', () => {
		const newMessage = createMockTextMessage({ roomId: room.id, from: 'userId' });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on conversation with focused input', () => {
		const store = useStore.getState();
		store.setSelectedRoomOneToOneGroup(room.id);
		store.setInputHasFocus(room.id, true);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on muted conversation', () => {
		const store = useStore.getState();
		store.setRoomMuted(room.id);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on meeting tab', () => {
		const room = createMockRoom();
		const store = useStore.getState();
		const meeting = createMockMeeting({ roomId: room.id });
		store.addMeeting(meeting);
		store.meetingConnection(meeting.id, false, undefined, false, undefined);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});
});
