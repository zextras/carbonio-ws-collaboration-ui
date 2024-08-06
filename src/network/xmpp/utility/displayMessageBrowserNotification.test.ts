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
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';

const room = createMockRoom();
const loggedUser = createMockUser({ id: 'loggeduserId', name: 'Logged User' });
const user = createMockUser({ id: 'userId', name: 'User' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(user);
	store.addRoom(room);
});
describe('Test display message browser notification', () => {
	test('Send desktop notification on new message', async () => {
		const newMessage = createMockTextMessage({ roomId: room.id, from: user.id });
		await displayMessageBrowserNotification(newMessage);
		expect(mockNotify).toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on my message', async () => {
		const newMessage = createMockTextMessage({ roomId: room.id, from: loggedUser.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on conversation with focused input', async () => {
		const store = useStore.getState();
		store.setSelectedRoomOneToOneGroup(room.id);
		store.setInputHasFocus(room.id, true);

		const newMessage = createMockTextMessage({ roomId: room.id, from: user.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on muted conversation', async () => {
		const store = useStore.getState();
		store.setRoomMuted(room.id);

		const newMessage = createMockTextMessage({ roomId: room.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on meeting tab', async () => {
		const room = createMockRoom();
		const store = useStore.getState();
		const meeting = createMockMeeting({ roomId: room.id });
		store.addMeeting(meeting);
		store.meetingConnection(meeting.id, false, undefined, false, undefined);

		const newMessage = createMockTextMessage({ roomId: room.id, from: user.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});
});
