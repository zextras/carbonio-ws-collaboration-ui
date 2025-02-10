/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onPingStanza, onPresenceStanza } from './presenceHandler';
import useStore from '../../../store/Store';
import { createMockUser } from '../../../tests/createMock';
import {
	offlinePresenceStanza,
	onlinePresenceStanza,
	pingStanza
} from '../../../tests/mocks/XMPPStanza';

const loggedUser = createMockUser({ id: 'userId-logged', name: 'User Logged' });
const mockUser = createMockUser({ id: 'userId-mock', name: 'User Mock' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(mockUser);
});

describe('XMPP presenceHandler', () => {
	test('New online presence arrives', () => {
		// A new online presence arrives
		onPresenceStanza.call(
			useStore.getState().connections.xmppClient,
			onlinePresenceStanza(mockUser.id)
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[mockUser.id].online).toBeTruthy();
	});

	test('User goes offline during the session', () => {
		// A new offline presence arrives
		onPresenceStanza.call(
			useStore.getState().connections.xmppClient,
			onlinePresenceStanza(mockUser.id)
		);
		onPresenceStanza.call(
			useStore.getState().connections.xmppClient,
			offlinePresenceStanza(mockUser.id)
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[mockUser.id].online).toBeFalsy();
	});

	test('Logged user remains online if an offline presence arrives from another session', () => {
		// A new offline presence arrives
		onPresenceStanza.call(
			useStore.getState().connections.xmppClient,
			onlinePresenceStanza(loggedUser.id)
		);
		onPresenceStanza.call(
			useStore.getState().connections.xmppClient,
			offlinePresenceStanza(loggedUser.id)
		);

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[loggedUser.id].online).toBeTruthy();
	});

	test('Send pong when a ping stanza arrives', () => {
		const spyOnSendPong = jest.spyOn(useStore.getState().connections.xmppClient, 'sendPong');
		// A new ping stanza arrives
		const stanzaId = 'pingStanzaId';
		onPingStanza.call(useStore.getState().connections.xmppClient, pingStanza(stanzaId));

		// Check if pong is sent
		expect(spyOnSendPong).toHaveBeenCalled();
	});
});
