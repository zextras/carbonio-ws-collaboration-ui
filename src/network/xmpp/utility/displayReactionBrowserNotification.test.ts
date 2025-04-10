/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import displayReactionBrowserNotification from './displayReactionBrowserNotification';
import { mockNotify } from '../../../../__mocks__/@zextras/carbonio-shell-ui';
import useStore from '../../../store/Store';
import {
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { FasteningAction } from '../../../types/store/ChatsRegistryTypes';

const loggedUser = createMockUser({ id: 'loggeduserId', name: 'Logged User' });
const user = createMockUser({ id: 'userId', name: 'User' });

const room = createMockRoom();
const messageFromMe = createMockTextMessage({
	id: 'id1',
	stanzaId: 'stanza1',
	roomId: room.id,
	from: loggedUser.id
});
const messageFromUser = createMockTextMessage({
	id: 'id2',
	stanzaId: 'stanza2',
	roomId: room.id,
	from: user.id
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo([user]);
	store.addRooms([room]);
	store.newMessage(messageFromMe);
	store.newMessage(messageFromUser);
});

describe('Test display reaction browser notification', () => {
	test('Send desktop notification on new reaction to my message', async () => {
		const newReaction = createMockMessageFastening({
			roomId: room.id,
			action: FasteningAction.REACTION,
			originalStanzaId: messageFromMe.stanzaId,
			from: user.id
		});
		await displayReactionBrowserNotification(newReaction);
		expect(mockNotify).toHaveBeenCalled();
	});

	test('Avoid sending desktop notification on new reaction in others message', async () => {
		const newReaction = createMockMessageFastening({
			roomId: room.id,
			action: FasteningAction.REACTION,
			originalStanzaId: messageFromUser.stanzaId,
			from: user.id
		});
		await displayReactionBrowserNotification(newReaction);

		expect(mockNotify).not.toHaveBeenCalled();
	});
});
