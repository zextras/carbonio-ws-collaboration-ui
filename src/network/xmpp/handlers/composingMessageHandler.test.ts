/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onComposingMessageStanza } from './composingMessageHandler';
import useStore from '../../../store/Store';
import { createMockRoom, createMockUser } from '../../../tests/createMock';
import { xmppClient } from '../../../tests/mockedXmppClient';
import { composingStanza, pausedStanza } from '../../../tests/mocks/XMPPStanza';

const user0 = createMockUser({ id: 'user0' });
const mockedRoom = createMockRoom({ id: 'groupId', participants: [user0] });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(mockedRoom);
});
describe('XMPP composingMessageHandler', () => {
	test('New composing message arrives', () => {
		// A new composing message arrives
		const messageXMPP = composingStanza(mockedRoom.id, user0.id);
		onComposingMessageStanza.call(xmppClient, messageXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id].isWritingList?.length).toBe(1);
	});

	test('New paused message arrives', () => {
		// A new composing message arrives
		const messageXMPP = pausedStanza(mockedRoom.id, user0.id);
		onComposingMessageStanza.call(xmppClient, messageXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id].isWritingList?.length).toBe(0);
	});

	test('New composing message arrives from me', () => {
		// A new composing message arrives
		const messageXMPP = composingStanza(mockedRoom.id, 'myUserId');
		onComposingMessageStanza.call(xmppClient, messageXMPP);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.activeConversations[mockedRoom.id]).not.toBeDefined();
	});
});
