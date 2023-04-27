/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import displayMessageBrowserNotification from './displayMessageBrowserNotification';
import { mockNotify } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';

describe('Test display message browser notification', () => {
	test('Send desktop notification on new message', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).toBeCalled();
	});

	test('Avoid sending desktop notification on my message', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		store.setLoginInfo('userId', 'User');

		const newMessage = createMockTextMessage({ roomId: room.id, from: 'userId' });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on conversation with focused input', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		store.setSelectedRoomOneToOneGroup(room.id);
		store.setInputHasFocus(room.id, true);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});

	test('Avoid sending desktop notification on muted conversation', () => {
		const store = useStore.getState();
		const room = createMockRoom();
		store.addRoom(room);
		store.setRoomMuted(room.id);

		const newMessage = createMockTextMessage({ roomId: room.id });
		displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toBeCalled();
	});
});
