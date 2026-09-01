/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { wsGeneralEventsHandler } from './wsGeneralEventsHandler';
import { catchUpChatState, handleChatReconnection } from './wsReconnectionHandler';
import useStore from '../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import * as InfoApi from '../apis/InfoApi';
import { wscSdk } from '../sdk/wscSdk';
import { xmppClient } from '../xmpp/XMPPClient';

describe('wsReconnectionHandler', () => {
	afterEach(() => {
		// The zustand store survives across tests: leave the version un-negotiated
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
	});

	test('On a WSC-pure backend the catch-up resets the chat data and refreshes the inbox', () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-r' })]);
		useStore
			.getState()
			.updateHistory('room-r', [createMockTextMessage({ id: 'm1', roomId: 'room-r' })]);
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);

		catchUpChatState();

		// The v1 strophe reconnection parity: volatile chat data is dropped and
		// re-requested; the open conversation reloads reactively
		expect(useStore.getState().chatsRegistry).toEqual({});
		expect(inboxSpy).toHaveBeenCalledTimes(1);
	});

	test('On 1.6.x the catch-up is a no-op: strophe owns its own reconnection routine', () => {
		useStore.getState().setApiVersion('1.6.14');
		useStore.getState().addRooms([createMockRoom({ id: 'room-v1' })]);
		useStore
			.getState()
			.updateHistory('room-v1', [createMockTextMessage({ id: 'm1', roomId: 'room-v1' })]);
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox');

		catchUpChatState();

		expect(useStore.getState().chatsRegistry['room-v1'].messages).toHaveLength(1);
		expect(inboxSpy).not.toHaveBeenCalled();
	});

	test('A reconnection still on the WSC-pure stack catches up without touching XMPP', () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const teardownSpy = vi.spyOn(xmppClient, 'disconnect');

		handleChatReconnection(true);

		expect(inboxSpy).toHaveBeenCalledTimes(1);
		expect(teardownSpy).not.toHaveBeenCalled();
	});

	test('A forward flip (1.6.x -> 2.0.0) tears down strophe, parks the health flag and catches up', () => {
		useStore.getState().setApiVersion('2.0.0'); // realigned by _onOpen from the sub-protocol
		useStore.getState().setXmppStatus(false); // strophe died with MongooseIM
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const teardownSpy = vi.spyOn(xmppClient, 'disconnect').mockImplementation(() => undefined);

		handleChatReconnection(false); // the gate said 1.6.x before the realignment

		expect(teardownSpy).toHaveBeenCalledTimes(1);
		expect(useStore.getState().connections.status.xmpp).toBe(true);
		expect(inboxSpy).toHaveBeenCalledTimes(1);
	});

	test('A backward flip (2.0.0 -> 1.6.x) resets the v2 data and boots the XMPP stack', async () => {
		useStore.getState().setApiVersion('1.6.14'); // realigned by _onOpen from the sub-protocol
		useStore.getState().addRooms([createMockRoom({ id: 'room-b' })]);
		useStore
			.getState()
			.updateHistory('room-b', [createMockTextMessage({ id: 'm2', roomId: 'room-b' })]);
		const tokenSpy = vi.spyOn(InfoApi, 'getToken').mockResolvedValue({ zmToken: 'fresh-token' });
		const connectSpy = vi.spyOn(xmppClient, 'connect').mockImplementation(() => undefined);

		handleChatReconnection(true); // the gate said 2.0.0 before the realignment

		await vi.waitFor(() => expect(connectSpy).toHaveBeenCalledWith('fresh-token'));
		expect(tokenSpy).toHaveBeenCalledTimes(1);
		expect(useStore.getState().chatsRegistry).toEqual({});
	});

	test('A backward flip with a failing token fetch flags the chats backend as down', async () => {
		useStore.getState().setApiVersion('1.6.14');
		vi.spyOn(InfoApi, 'getToken').mockRejectedValue(new Error('boom'));

		handleChatReconnection(true);

		await vi.waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(false));
		useStore.getState().setChatsBeStatus(true);
	});

	test('MessageBrokerRestored triggers the same catch-up on a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);

		wsGeneralEventsHandler({ type: WsEventType.MESSAGE_BROKER_RESTORED });

		// Chat events published while the broker was down never reached the
		// socket: the flag flips back healthy and the state is re-requested
		expect(useStore.getState().connections.status.messageBroker).toBe(true);
		expect(inboxSpy).toHaveBeenCalledTimes(1);
	});
});
