/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPingHandler, createPresenceHandler } from './presenceHandler';
import useStore from '../../../store/Store';
import { buildPingStanza, buildPresenceStanza } from '../../../tests/buildXmppStanza';
import { createMockUser } from '../../../tests/createMock';
import { mockMessagingService } from '../../../tests/mock-messaging-service';

const onPresenceStanza = createPresenceHandler(mockMessagingService);
const onPingStanza = createPingHandler(mockMessagingService);

const loggedUser = createMockUser({ id: 'userId-logged', name: 'User Logged' });
const mockUser = createMockUser({ id: 'userId-mock', name: 'User Mock' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: loggedUser.id, name: loggedUser.name });
	store.setUserInfo([mockUser]);
});

describe('XMPP presenceHandler', () => {
	test('New online presence arrives', () => {
		// A new online presence arrives
		onPresenceStanza(buildPresenceStanza({ from: mockUser.id, online: true }));

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[mockUser.id].online).toBeTruthy();
	});

	test('User goes offline during the session', () => {
		// A new offline presence arrives
		onPresenceStanza(buildPresenceStanza({ from: mockUser.id, online: true }));
		onPresenceStanza(buildPresenceStanza({ from: mockUser.id, online: false }));

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[mockUser.id].online).toBeFalsy();
	});

	test('Logged user remains online if an offline presence arrives from another session', () => {
		// A new offline presence arrives
		onPresenceStanza(buildPresenceStanza({ from: loggedUser.id, online: true }));
		onPresenceStanza(buildPresenceStanza({ from: loggedUser.id, online: false }));

		// Check if information are stored correctly
		const store = useStore.getState();
		expect(store.users[loggedUser.id].online).toBeTruthy();
	});

	test('Send pong when a ping stanza arrives', () => {
		// A new ping stanza arrives
		const stanzaId = 'pingStanzaId';
		onPingStanza(buildPingStanza({ pingId: stanzaId }));

		// Check if pong is sent
		expect(mockMessagingService.sendPong).toHaveBeenCalled();
	});
});
