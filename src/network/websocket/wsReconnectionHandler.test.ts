/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Mock } from 'vitest';

import * as presenceRefresh from './presenceRefresh';
import { wsGeneralEventsHandler } from './wsGeneralEventsHandler';
import {
	catchUpChatState,
	handleChatReconnection,
	handleWebsocketConnected
} from './wsReconnectionHandler';
import useStore from '../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import * as InfoApi from '../apis/InfoApi';
import { chatClient } from '../chatClient/ChatClient';
import { BOOT_INBOX_TIMEOUT_MS } from '../chatClient/inboxRefresh';
import { wscSdk } from '../sdk/wscSdk';
import { xmppClient } from '../xmpp/XMPPClient';

describe('wsReconnectionHandler', () => {
	afterEach(() => {
		wscSdk.reset();
		vi.useRealTimers();
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

		expect(inboxSpy).not.toHaveBeenCalled();
		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });

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
		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
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
		const resetSdkSpy = vi.spyOn(wscSdk, 'reset').mockImplementation(() => undefined);

		handleChatReconnection(true); // the gate said 2.0.0 before the realignment

		await vi.waitFor(() => expect(connectSpy).toHaveBeenCalledWith('fresh-token'));
		expect(tokenSpy).toHaveBeenCalledTimes(1);
		expect(resetSdkSpy).toHaveBeenCalledTimes(1);
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

	test('WebsocketConnected on the first connection refreshes presence only, once', () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const refreshSpy = vi
			.spyOn(presenceRefresh, 'refreshPresenceOfStoredRooms')
			.mockImplementation(() => undefined);

		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });

		expect(refreshSpy).toHaveBeenCalledTimes(1);
		expect(inboxSpy).not.toHaveBeenCalled();
	});

	test('WebsocketConnected after a reconnection runs the catch-up once, then only presence', () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const refreshSpy = vi
			.spyOn(presenceRefresh, 'refreshPresenceOfStoredRooms')
			.mockImplementation(() => undefined);

		handleChatReconnection(true);
		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		expect(inboxSpy).toHaveBeenCalledTimes(1);
		expect(refreshSpy).not.toHaveBeenCalled();

		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		expect(inboxSpy).toHaveBeenCalledTimes(1);
		expect(refreshSpy).toHaveBeenCalledTimes(1);
	});

	test('WebsocketConnected on 1.6.x does not touch the chat state', () => {
		useStore.getState().setApiVersion('1.6.14');
		const refreshSpy = vi.spyOn(presenceRefresh, 'refreshPresenceOfStoredRooms');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox');

		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });

		expect(refreshSpy).not.toHaveBeenCalled();
		expect(inboxSpy).not.toHaveBeenCalled();
	});

	test('A reconnection while the boot inbox is waiting cancels its timer: one inbox, one reset', async () => {
		vi.useFakeTimers();
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const resetSpy = vi.spyOn(useStore.getState(), 'resetXmppData');

		chatClient.connect('token');
		handleChatReconnection(true);
		handleWebsocketConnected();
		await vi.advanceTimersByTimeAsync(2 * BOOT_INBOX_TIMEOUT_MS);

		expect(inboxSpy).toHaveBeenCalledTimes(1);
		expect(resetSpy).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	test('WebsocketConnected retries the pending sends on the first connection and on every reconnection', () => {
		vi.useFakeTimers();
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		vi.spyOn(presenceRefresh, 'refreshPresenceOfStoredRooms').mockImplementation(() => undefined);
		const retrySpy = vi.spyOn(wscSdk, 'retryPendingSends').mockImplementation(() => undefined);

		chatClient.connect('token');
		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		expect(inboxSpy).toHaveBeenCalledTimes(1);
		expect(retrySpy).toHaveBeenCalledTimes(1);

		handleChatReconnection(true);
		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		expect(retrySpy).toHaveBeenCalledTimes(2);
	});

	test('A reconnection retries the pending sends once, not twice', () => {
		useStore.getState().setApiVersion('2.0.0');
		vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const retrySpy = vi.spyOn(wscSdk, 'retryPendingSends').mockImplementation(() => undefined);

		handleChatReconnection(true);
		handleWebsocketConnected();

		expect(retrySpy).toHaveBeenCalledTimes(1);
	});

	test('MessageBrokerRestored keeps the pending send in store after the reset', async () => {
		vi.useFakeTimers();
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error('offline')));
		chatClient.sendChatMessage('room-bb', 'pending text');
		await vi.advanceTimersByTimeAsync(0);
		expect(useStore.getState().chatsRegistry['room-bb'].messages).toHaveLength(1);

		wsGeneralEventsHandler({ type: WsEventType.MESSAGE_BROKER_RESTORED });

		expect(useStore.getState().chatsRegistry['room-bb'].messages).toHaveLength(1);
	});

	test('The pending sends are retried after the reconnection reset, never before it', () => {
		useStore.getState().setApiVersion('2.0.0');
		vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);
		const order: Array<string> = [];
		vi.spyOn(useStore.getState(), 'resetXmppData').mockImplementation(() => {
			order.push('reset');
		});
		vi.spyOn(wscSdk, 'retryPendingSends').mockImplementation(() => {
			order.push('retry');
		});

		handleChatReconnection(true);
		handleWebsocketConnected();

		expect(order).toEqual(['reset', 'retry']);
	});

	test('WebsocketConnected on 1.6.x does not retry any send', () => {
		useStore.getState().setApiVersion('1.6.14');
		const retrySpy = vi.spyOn(wscSdk, 'retryPendingSends');

		handleWebsocketConnected();

		expect(retrySpy).not.toHaveBeenCalled();
	});
});
