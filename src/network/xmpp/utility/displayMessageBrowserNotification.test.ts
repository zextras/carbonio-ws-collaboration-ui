/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shell from '@zextras/carbonio-shell-ui';

import displayMessageBrowserNotification from './displayMessageBrowserNotification';
import { mockNotify } from '../../../../__mocks__/@zextras/carbonio-shell-ui';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage, createMockUser } from '../../../tests/createMock';

const room = createMockRoom();
const loggedUser = createMockUser({ id: 'loggedUserId', name: 'Logged User' });
const user = createMockUser({ id: 'userId', name: 'User' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: loggedUser.id, name: loggedUser.name });
	store.setUserInfo([user]);
	store.addRooms([room]);
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
		store.setSelectedRoom(room.id);
		store.setInputHasFocus(room.id, true);

		const newMessage = createMockTextMessage({ roomId: room.id, from: user.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on muted conversation', async () => {
		const store = useStore.getState();
		store.setRoomMuteStatus(room.id, true);

		const newMessage = createMockTextMessage({ roomId: room.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on meeting tab', async () => {
		Object.defineProperty(shell, 'IS_FOCUS_MODE', { value: true });
		const newMessage = createMockTextMessage({ roomId: room.id, from: user.id });
		await displayMessageBrowserNotification(newMessage);

		expect(mockNotify).not.toHaveBeenCalled();
	});
});
