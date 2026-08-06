/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	buildInboxEntry,
	buildInboxMember,
	buildInboxResponse,
	buildMessageTimelineItem,
	buildReadMarker,
	buildSystemEvent,
	buildSystemEventTimelineItem,
	buildTimelineResponse,
	buildWireMessage
} from '@zextras/carbonio-ws-collaboration-sdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { chatClient, isWscPure } from './ChatClient';
import useStore from '../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { xmppClient } from '../xmpp/XMPPClient';

const AUG_FIRST_MORNING = '2026-08-01T09:00:00Z';

function mockJsonResponse(body: unknown): void {
	(global.fetch as Mock).mockImplementationOnce(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			headers: {
				get: (name: string): string | null =>
					name.toLowerCase() === 'content-type' ? 'application/json' : null
			},
			json: (): Promise<unknown> => Promise.resolve(body),
			blob: (): Promise<unknown> => Promise.resolve(undefined)
		})
	);
}

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
							lastActivity: AUG_FIRST_MORNING
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
		mockJsonResponse(inbox);

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
			lastActivity: Date.parse(AUG_FIRST_MORNING)
		});
		expect(useStore.getState().connections.status.xmpp).toBe(true);
	});

	it('loads a history page through the SDK on a WSC-pure backend: GET timeline hydrates the store', async () => {
		useStore.getState().setApiVersion('2.0.0');
		// The real-world case: ROOM_CREATED shares the room's createdAt (same
		// transaction), landing exactly at the notBefore bound the façade derives
		const roomCreatedAt = '2026-08-01T08:00:00Z';
		useStore.getState().addRooms([createMockRoom({ id: 'room-t', createdAt: roomCreatedAt })]);
		const timeline = buildTimelineResponse(
			[
				buildSystemEventTimelineItem(
					buildSystemEvent({
						id: 'evt-created',
						roomId: 'room-t',
						type: 'ROOM_CREATED',
						content: { creatorId: 'user-1' },
						createdAt: roomCreatedAt
					})
				),
				buildMessageTimelineItem(
					buildWireMessage({
						id: 'msg-t1',
						roomId: 'room-t',
						senderId: 'user-2',
						text: 'ciao',
						createdAt: '2026-08-01T10:00:00Z'
					})
				)
			],
			{
				hasMoreBefore: false,
				markers: [
					buildReadMarker({ userId: 'user-2', messageId: 'msg-t1', readAt: '2026-08-01T10:05:00Z' })
				]
			}
		);
		mockJsonResponse(timeline);

		chatClient.requestHistory('room-t', Date.parse('2026-08-02T00:00:00Z'));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-t/timeline?before=2026-08-02T00%3A00%3A00.000Z&limit=50'
		);
		const { messages } = useStore.getState().chatsRegistry['room-t'];
		// The backend ROOM_CREATED event survives the inclusive notBefore bound and
		// is the opener: no synthetic duplicate added
		expect(messages.map((message) => message.id)).toEqual(['evt-created', 'msg-t1']);
		expect(messages[0]).toMatchObject({
			type: 'configuration',
			operation: 'roomCreation',
			from: 'user-1'
		});
		expect(messages[1]).toMatchObject({ id: 'msg-t1', stanzaId: 'msg-t1', text: 'ciao' });
		expect(useStore.getState().activeConversations['room-t']?.isHistoryFullyLoaded).toBe(true);
		expect(useStore.getState().activeConversations['room-t']?.isHistoryLoadDisabled).toBe(false);
	});

	it('anchors the next page with the composite cursor of the oldest loaded message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore
			.getState()
			.addRooms([createMockRoom({ id: 'room-c', createdAt: '2026-07-01T00:00:00Z' })]);
		const oldestDate = Date.parse(AUG_FIRST_MORNING);
		useStore
			.getState()
			.updateHistory('room-c', [
				createMockTextMessage({ id: 'msg-old', roomId: 'room-c', date: oldestDate })
			]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true }));

		chatClient.requestHistory('room-c', oldestDate);
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-c/timeline?before=2026-08-01T09%3A00%3A00.000Z&beforeId=msg-old&limit=50'
		);
	});

	it('bails out on unknown rooms without hitting the network (v1 parity)', () => {
		useStore.getState().setApiVersion('2.0.0');

		chatClient.requestHistory('room-ghost', Date.parse(AUG_FIRST_MORNING));

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('exposes the live XMPP features list', () => {
		xmppClient.features = ['zextras:iq:pin'];

		expect(chatClient.features).toEqual(['zextras:iq:pin']);

		xmppClient.features = [];
	});
});
