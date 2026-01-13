/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onComposingMessageStanza } from './composingMessageHandler';
import useStore from '../../../store/Store';
import { buildComposingStanza } from '../../../tests/buildXmppStanza';
import { createMockMember, createMockRoom, createMockUser } from '../../../tests/createMock';

const user0 = createMockUser({ id: 'user0' });
const mockedRoom = createMockRoom({
	id: 'groupId',
	members: [createMockMember({ userId: user0.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRooms([mockedRoom]);
});

describe('XMPP composingMessageHandler', () => {
	test('New composing message arrives', () => {
		// A new composing message arrives
		onComposingMessageStanza.call(
			useStore.getState().connections.xmppClient,
			buildComposingStanza({
				roomId: mockedRoom.id,
				from: user0.id,
				isWriting: true
			})
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id].isWritingList?.length).toBe(1);
	});

	test('New paused message arrives', () => {
		// A new composing message arrives
		onComposingMessageStanza.call(
			useStore.getState().connections.xmppClient,
			buildComposingStanza({
				roomId: mockedRoom.id,
				from: user0.id,
				isWriting: false
			})
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id].isWritingList?.length).toBe(0);
	});

	test('New composing message arrives from me', () => {
		// A new composing message arrives
		onComposingMessageStanza.call(
			useStore.getState().connections.xmppClient,
			buildComposingStanza({
				roomId: mockedRoom.id,
				from: 'myUserId',
				isWriting: true
			})
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id]).not.toBeDefined();
	});
});
