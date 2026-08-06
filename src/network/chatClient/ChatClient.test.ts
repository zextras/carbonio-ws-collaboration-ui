/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	buildInboxEntry,
	buildInboxMember,
	buildInboxResponse,
	buildReadMarker,
	buildWireMessage
} from '@zextras/carbonio-ws-collaboration-sdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { chatClient, isWscPure } from './ChatClient';
import useStore from '../../store/Store';
import { xmppClient } from '../xmpp/XMPPClient';

describe('chatClient façade', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('delegates to the XMPP stack against a legacy backend', () => {
		useStore.getState().setApiVersion('1.6.13');
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeFalsy();
		expect(spy).toHaveBeenCalledWith('room-id', 'hello');
	});

	it('delegates to the XMPP stack when no version has been negotiated yet', () => {
		// Explicit: previous tests may have negotiated a version on the shared store
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeFalsy();
		expect(spy).toHaveBeenCalledWith('room-id', 'hello');
	});

	it('does not touch the XMPP stack against a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'sendChatMessage').mockImplementation(() => undefined);

		chatClient.sendChatMessage('room-id', 'hello');

		expect(isWscPure()).toBeTruthy();
		expect(spy).not.toHaveBeenCalled();
	});

	it('skips the XMPP connection against a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'connect').mockImplementation(() => undefined);

		chatClient.connect('token');

		expect(spy).not.toHaveBeenCalled();
	});

	it('resolves the promise-returning methods without XMPP against a WSC-pure backend', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'fullTextSearch');

		await expect(chatClient.fullTextSearch('room-id', 'text')).resolves.toBeUndefined();
		await expect(
			chatClient.requestMessageToForward('room-id', 'stanza-id', 'query-id')
		).resolves.toBeUndefined();

		expect(spy).not.toHaveBeenCalled();
	});

	it('boots the chat through the SDK on a WSC-pure backend: GET /inbox hydrates the store', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const connectSpy = vi.spyOn(xmppClient, 'connect').mockImplementation(() => undefined);
		const inbox = buildInboxResponse([
			buildInboxEntry({
				roomId: 'room-1',
				room: {
					id: 'room-1',
					type: 'group',
					members: [
						buildInboxMember({
							userId: 'user-2',
							online: false,
							lastActivity: '2026-08-01T09:00:00Z'
						})
					]
				},
				lastMessage: buildWireMessage({
					id: 'msg-1',
					roomId: 'room-1',
					senderId: 'user-2',
					text: 'ciao',
					createdAt: '2026-08-01T10:00:00Z'
				}),
				unreadCount: 2,
				markers: [
					buildReadMarker({ userId: 'user-2', messageId: 'msg-1', readAt: '2026-08-01T10:05:00Z' })
				]
			})
		]);
		(global.fetch as Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: {
					get: (name: string): string | null =>
						name.toLowerCase() === 'content-type' ? 'application/json' : null
				},
				json: (): Promise<unknown> => Promise.resolve(inbox),
				blob: (): Promise<unknown> => Promise.resolve(undefined)
			})
		);

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(0);

		expect(connectSpy).not.toHaveBeenCalled();
		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/inbox');
		const registry = useStore.getState().chatsRegistry['room-1'];
		expect(registry?.lastMessage).toMatchObject({
			id: 'msg-1',
			stanzaId: 'msg-1',
			text: 'ciao',
			read: 'unread'
		});
		expect(registry?.inboxMessageId).toBe('msg-1');
		expect(registry?.unread).toBe(2);
		expect(useStore.getState().users['user-2']).toMatchObject({
			online: false,
			lastActivity: Date.parse('2026-08-01T09:00:00Z')
		});
		expect(useStore.getState().connections.status.xmpp).toBe(true);
	});

	it('exposes the live XMPP features list', () => {
		xmppClient.features = ['zextras:iq:pin'];

		expect(chatClient.features).toEqual(['zextras:iq:pin']);

		xmppClient.features = [];
	});
});
