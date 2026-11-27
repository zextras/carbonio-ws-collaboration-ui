/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	buildInboxEntry,
	buildInboxMember,
	buildInboxResponse,
	buildMessage,
	buildMessageTimelineItem,
	buildPinnedMessage,
	buildReadMarker,
	buildSystemEvent,
	buildSystemEventTimelineItem,
	buildTimelineResponse,
	buildWireMessage
} from '@zextras/carbonio-ws-collaboration-ui-sdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { chatClient, isWscPure } from './ChatClient';
import { downloadChatExport } from './chatExportDownload';
import { BOOT_INBOX_TIMEOUT_MS, refreshInboxSerialized } from './inboxRefresh';
import { PLACEHOLDER_STANZA_PREFIX } from '../../constants/messageConstants';
import useStore from '../../store/Store';
import {
	buildWsMessageDeletedEvent,
	buildWsMessageEditedEvent,
	buildWsMessageReceivedEvent,
	buildWsReactionChangedEvent
} from '../../tests/buildWsChatEvent';
import {
	createMockConfigurationMessage,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { MarkerStatus } from '../../types/store/ChatsRegistryTypes';
import { wscSdk } from '../sdk/wscSdk';
import { wsClient } from '../websocket/WebSocketClient';
import { wsChatEventsRouter } from '../websocket/wsChatEventsRouter';
import { wsGeneralEventsHandler } from '../websocket/wsGeneralEventsHandler';
import { xmppClient } from '../xmpp/XMPPClient';

// The DOM download side is unit-tested in chatExportDownload.test.ts
vi.mock('./chatExportDownload');

const pendingId = 'msg-pending';
const AUG_FIRST_EARLY = '2026-08-01T08:00:00Z';
const BACKEND_DOWN = 'backend down';
const AUG_FIRST_NOON = '2026-08-01T11:00:00Z';
const NEWEST_ID = 'msg-newest';
const JULY_FIRST = '2026-07-01T00:00:00Z';
const AUG_FIRST_MORNING = '2026-08-01T09:00:00Z';
const PIN_FEATURE = 'zextras:iq:pin';
const AUG_FIRST_LATE_MORNING = '2026-08-01T10:00:00Z';
const inboxRoomId = 'room-se-inbox';
const twiceRoomId = 'room-twice';
const flightRoomId = 'room-flight';
const quotedId = 'msg-quoted';
const editTargetId = 'msg-target';
const editedText = 'testo corretto';
const originalText = 'testo originale';
const jumpRoomId = 'room-j';
const jumpTargetId = 'msg-jump-target';
const jumpRecentId = 'msg-recent';

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
		wscSdk.reset();
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
		const spy = vi.spyOn(xmppClient, 'requestMessageToForward');

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
				lastItem: buildMessageTimelineItem(
					buildWireMessage({
						id: 'msg-1',
						roomId: 'room-1',
						senderId: 'user-2',
						text: 'ciao',
						createdAt: AUG_FIRST_LATE_MORNING
					})
				),
				unreadCount: 2,
				markers: [
					// v2 markers carry the createdAt of the marked item
					buildReadMarker({ userId: 'user-2', itemCreatedAt: AUG_FIRST_LATE_MORNING })
				]
			})
		]);
		mockJsonResponse(inbox);

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS);

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
		// The timestamp marker resolves on the inbox last message
		expect(registry?.markers['user-2']).toEqual({
			from: 'user-2',
			messageId: 'msg-1',
			markerDate: Date.parse(AUG_FIRST_LATE_MORNING),
			type: 'displayed'
		});
		expect(registry?.unread).toBe(2);
		expect(useStore.getState().users['user-2']).toMatchObject({
			online: false,
			lastActivity: Date.parse(AUG_FIRST_MORNING)
		});
		expect(useStore.getState().connections.status.xmpp).toBe(true);
	});

	it('hydrates a system_event lastItem of GET /inbox as the room last configuration row', async () => {
		useStore.getState().setApiVersion('2.0.0');
		vi.spyOn(xmppClient, 'connect').mockImplementation(() => undefined);
		mockJsonResponse(
			buildInboxResponse([
				buildInboxEntry({
					roomId: inboxRoomId,
					lastItem: buildSystemEventTimelineItem(
						buildSystemEvent({
							id: 'evt-last',
							roomId: inboxRoomId,
							type: 'MESSAGE_PINNED',
							actorId: 'user-3',
							content: { messageId: 'msg-1' },
							createdAt: AUG_FIRST_LATE_MORNING
						})
					)
				})
			])
		);

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS);

		const registry = useStore.getState().chatsRegistry[inboxRoomId];
		expect(registry?.inboxMessageId).toBe('evt-last');
		expect(registry?.lastMessage).toMatchObject({
			id: 'evt-last',
			type: 'configuration',
			operation: 'messagePinned',
			from: 'user-3'
		});
	});

	it('does not count twice a message the inbox already counted', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		mockJsonResponse(
			buildInboxResponse([
				buildInboxEntry({
					roomId: twiceRoomId,
					lastItem: buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-last',
							roomId: twiceRoomId,
							senderId: 'user-2',
							text: 'ciao',
							createdAt: AUG_FIRST_MORNING
						})
					),
					unreadCount: 3,
					markers: []
				})
			])
		);
		await refreshInboxSerialized('inbox refresh failed');

		wsChatEventsRouter(
			buildWsMessageReceivedEvent(
				buildWireMessage({
					id: 'msg-last',
					roomId: twiceRoomId,
					senderId: 'user-2',
					text: 'ciao',
					createdAt: AUG_FIRST_MORNING
				})
			)
		);

		expect(useStore.getState().chatsRegistry[twiceRoomId].unread).toBe(3);
	});

	it('keeps a live message that arrives while the inbox response is in flight', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		// The server snapshot was taken before msg-newer existed
		mockJsonResponse(
			buildInboxResponse([
				buildInboxEntry({
					roomId: flightRoomId,
					lastItem: buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-last',
							roomId: flightRoomId,
							senderId: 'user-2',
							text: 'ciao',
							createdAt: AUG_FIRST_MORNING
						})
					),
					unreadCount: 2,
					markers: []
				})
			])
		);
		const refresh = refreshInboxSerialized('inbox refresh failed');

		wsChatEventsRouter(
			buildWsMessageReceivedEvent(
				buildWireMessage({
					id: 'msg-newer',
					roomId: flightRoomId,
					senderId: 'user-2',
					text: 'nuovo',
					createdAt: AUG_FIRST_LATE_MORNING
				})
			)
		);
		await refresh;

		expect(useStore.getState().chatsRegistry[flightRoomId].unread).toBe(3);
	});

	it('waits for the first WebsocketConnected before loading the boot inbox, once', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS - 1);
		expect(inboxSpy).not.toHaveBeenCalled();

		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		expect(inboxSpy).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS * 2);
		expect(inboxSpy).toHaveBeenCalledTimes(1);
	});

	it('falls back to the boot inbox on timeout and reloads it when the socket finally connects', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockResolvedValue(undefined);

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS);
		expect(inboxSpy).toHaveBeenCalledTimes(1);

		wsGeneralEventsHandler({ type: WsEventType.INITIALIZATION, queueId: 'q' });
		await vi.advanceTimersByTimeAsync(0);
		expect(inboxSpy).toHaveBeenCalledTimes(2);
	});

	it('logs and survives a failing inbox hydration on connect', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));

		chatClient.connect('token');
		await vi.advanceTimersByTimeAsync(BOOT_INBOX_TIMEOUT_MS);

		expect(errorSpy).toHaveBeenCalledWith(
			'chatClient.connect: inbox hydration failed',
			expect.any(Error)
		);
		// The legacy health flag was parked healthy before the failed round-trip:
		// the connection banners answer to chats_be/websocket on 2.0.0
		expect(useStore.getState().connections.status.xmpp).toBe(true);
	});

	it('loads a history page through the SDK on a WSC-pure backend: GET timeline hydrates the store', async () => {
		useStore.getState().setApiVersion('2.0.0');
		// The real-world case: ROOM_CREATED shares the room's createdAt (same
		// transaction), landing exactly at the notBefore bound the façade derives
		const roomCreatedAt = AUG_FIRST_EARLY;
		useStore.getState().addRooms([createMockRoom({ id: 'room-t', createdAt: roomCreatedAt })]);
		const timeline = buildTimelineResponse(
			[
				buildSystemEventTimelineItem(
					buildSystemEvent({
						id: 'evt-created',
						roomId: 'room-t',
						type: 'ROOM_CREATED',
						actorId: 'user-1',
						content: {},
						createdAt: roomCreatedAt
					})
				),
				buildMessageTimelineItem(
					buildWireMessage({
						id: 'msg-t1',
						roomId: 'room-t',
						senderId: 'user-2',
						text: 'ciao',
						createdAt: AUG_FIRST_LATE_MORNING
					})
				)
			],
			{
				hasMoreBefore: false,
				markers: [buildReadMarker({ userId: 'user-2', itemCreatedAt: AUG_FIRST_LATE_MORNING })]
			}
		);
		mockJsonResponse(timeline);

		chatClient.requestHistory('room-t', Date.parse('2026-08-02T00:00:00Z'));
		await vi.advanceTimersByTimeAsync(0);

		// Empty store: the caller bound is a synthetic client-clock now() and is
		// omitted — "the latest N" is decided by the server clock
		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-t/timeline?limit=50'
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
		expect(useStore.getState().chatsRegistry['room-t']?.markers['user-2']?.messageId).toBe(
			'msg-t1'
		);
		expect(useStore.getState().activeConversations['room-t']?.isHistoryFullyLoaded).toBe(true);
		expect(useStore.getState().activeConversations['room-t']?.isHistoryLoadDisabled).toBe(false);
	});

	it('anchors the next page with the composite cursor of the oldest loaded message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-c', createdAt: JULY_FIRST })]);
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
			'/services/chats/rooms/room-c/timeline?before=2026-08-01T09%3A00%3A00.000000Z&beforeId=msg-old&limit=50'
		);
	});

	it('never anchors a history page on a pending placeholder written back after a reconnection', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-pp', createdAt: JULY_FIRST })]);
		const oldestDate = Date.parse(AUG_FIRST_MORNING);
		useStore.getState().updateHistory('room-pp', [
			createMockTextMessage({
				id: pendingId,
				stanzaId: `${PLACEHOLDER_STANZA_PREFIX}${pendingId}`,
				roomId: 'room-pp',
				date: oldestDate - 60_000,
				read: MarkerStatus.PENDING
			}),
			createMockTextMessage({ id: 'msg-real', roomId: 'room-pp', date: oldestDate })
		]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true }));

		chatClient.requestHistory('room-pp', oldestDate);
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-pp/timeline?before=2026-08-01T09%3A00%3A00.000000Z&beforeId=msg-real&limit=50'
		);
	});

	it('loads the first page by the server clock when only pending placeholders are in store', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-po', createdAt: JULY_FIRST })]);
		const pendingDate = Date.parse(AUG_FIRST_MORNING);
		useStore.getState().updateHistory('room-po', [
			createMockTextMessage({
				id: pendingId,
				stanzaId: `${PLACEHOLDER_STANZA_PREFIX}${pendingId}`,
				roomId: 'room-po',
				date: pendingDate,
				read: MarkerStatus.PENDING
			})
		]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true }));

		chatClient.requestHistory('room-po', Date.parse('2026-08-02T00:00:00Z'));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-po/timeline?limit=50'
		);
	});

	it('logs and keeps the loader disabled on a failing history page (v1 parity)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-err' })]);
		// The loader disables itself synchronously before calling the façade
		useStore.getState().setHistoryLoadDisabled('room-err', true);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));

		chatClient.requestHistory('room-err', Date.parse(AUG_FIRST_MORNING));
		await vi.advanceTimersByTimeAsync(0);

		expect(errorSpy).toHaveBeenCalledWith(
			'chatClient.requestHistory: timeline hydration failed',
			expect.any(Error)
		);
		// Only the success path re-enables it — the v1 callback did the same
		expect(useStore.getState().activeConversations['room-err']?.isHistoryLoadDisabled).toBe(true);
	});

	it('omits the synthetic client-clock bound on the first load, keeps a real anchor', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-skew', createdAt: JULY_FIRST })]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: false }));

		// First load: empty store, the caller passes its own now() — a client
		// running behind the server must not cut off the newest messages
		chatClient.requestHistory('room-skew', Date.parse(AUG_FIRST_MORNING));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-skew/timeline?limit=50'
		);

		// Next page: the anchor is a loaded message, the explicit bound stays
		const oldestDate = Date.parse(AUG_FIRST_MORNING);
		useStore
			.getState()
			.updateHistory('room-skew', [
				createMockTextMessage({ id: 'msg-anchor', roomId: 'room-skew', date: oldestDate })
			]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true }));

		chatClient.requestHistory('room-skew', oldestDate);
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[1]?.[0]).toBe(
			'/services/chats/rooms/room-skew/timeline?before=2026-08-01T09%3A00%3A00.000000Z&beforeId=msg-anchor&limit=50'
		);
	});

	it('bails out on unknown rooms without hitting the network (v1 parity)', () => {
		useStore.getState().setApiVersion('2.0.0');

		chatClient.requestHistory('room-ghost', Date.parse(AUG_FIRST_MORNING));

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('moves the read marker through the SDK on a WSC-pure backend: PUT rooms/{id}/read', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().updateHistory('room-m', [
			createMockTextMessage({
				id: 'msg-m1',
				roomId: 'room-m',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		mockJsonResponse(undefined);

		chatClient.readMessage('room-m', 'msg-m1');
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-m/read');
		expect((global.fetch as Mock).mock.calls[0]?.[1]).toMatchObject({
			method: 'PUT',
			body: JSON.stringify({ itemId: 'msg-m1' })
		});
	});

	it('does not PUT a read marker for a message missing from the store (v1 parity)', () => {
		useStore.getState().setApiVersion('2.0.0');

		chatClient.readMessage('room-m', 'msg-ghost');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('does not PUT a read marker for a client-synthesized config row (F3: 404 on its id)', () => {
		useStore.getState().setApiVersion('2.0.0');
		const livePinRowId = `pin_msg-pinned_${Date.parse(AUG_FIRST_MORNING)}`;
		useStore.getState().updateHistory('room-cfg', [
			createMockConfigurationMessage({
				id: livePinRowId,
				roomId: 'room-cfg',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);

		chatClient.readMessage('room-cfg', livePinRowId);

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('PUTs a read marker on a config row from a timeline system event (server id)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const systemEventId = '6f1c2a4e-8d3b-4f7a-9c21-0b5e7d9a3f10';
		useStore.getState().updateHistory('room-se', [
			createMockConfigurationMessage({
				id: systemEventId,
				roomId: 'room-se',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		mockJsonResponse(undefined);

		chatClient.readMessage('room-se', systemEventId);
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-se/read');
		expect((global.fetch as Mock).mock.calls[0]?.[1]).toMatchObject({
			method: 'PUT',
			body: JSON.stringify({ itemId: systemEventId })
		});
	});

	it('sends a message through the SDK: optimistic placeholder, then the REST confirmation promotes it', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const sentId = 'msg-sent-1';
		mockJsonResponse(
			buildMessage({
				id: sentId,
				roomId: 'room-s',
				senderId: 'me',
				text: 'ciao',
				createdAt: AUG_FIRST_LATE_MORNING
			})
		);

		chatClient.sendChatMessage('room-s', 'ciao');

		// The placeholder lands synchronously, PENDING, with the tempId as id
		const pending = useStore.getState().chatsRegistry['room-s'].messages[0];
		expect(pending).toMatchObject({ text: 'ciao', read: 'pending', from: 'me' });
		const tempId = pending.id;

		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-s/messages');
		expect((global.fetch as Mock).mock.calls[0]?.[1]).toMatchObject({
			method: 'POST',
			body: JSON.stringify({ text: 'ciao', tempId })
		});
		const { messages, lastMessage } = useStore.getState().chatsRegistry['room-s'];
		expect(messages.map((message) => message.id)).toEqual([sentId]);
		expect(messages[0]).toMatchObject({ stanzaId: sentId, read: 'unread' });
		expect(lastMessage).toMatchObject({ id: sentId, text: 'ciao' });
	});

	it('keeps a single message when the self-echo lands before the REST confirmation', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		let releaseRest: () => void = () => undefined;
		(global.fetch as Mock).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					releaseRest = (): void =>
						resolve({
							ok: true,
							status: 201,
							headers: {
								get: (name: string): string | null =>
									name.toLowerCase() === 'content-type' ? 'application/json' : null
							},
							json: (): Promise<unknown> =>
								Promise.resolve(
									buildMessage({
										id: 'msg-dup',
										roomId: 'room-d',
										senderId: 'me',
										text: 'doppio',
										createdAt: AUG_FIRST_LATE_MORNING
									})
								)
						});
				})
		);

		chatClient.sendChatMessage('room-d', 'doppio');
		const tempId = useStore.getState().chatsRegistry['room-d'].messages[0].id;
		await vi.advanceTimersByTimeAsync(0);

		// The WS self-echo arrives while the REST call is still in flight
		wsChatEventsRouter(
			buildWsMessageReceivedEvent(
				buildWireMessage({
					id: 'msg-dup',
					roomId: 'room-d',
					senderId: 'me',
					text: 'doppio',
					createdAt: AUG_FIRST_LATE_MORNING
				}),
				{ tempId }
			)
		);
		expect(
			useStore.getState().chatsRegistry['room-d'].messages.map((message) => message.id)
		).toEqual(['msg-dup']);

		// The late REST confirmation must be a no-op, not a duplicate
		releaseRest();
		await vi.advanceTimersByTimeAsync(0);

		const { messages } = useStore.getState().chatsRegistry['room-d'];
		expect(messages.map((message) => message.id)).toEqual(['msg-dup']);
	});

	it('resolves false on a certain rejection, so the composer gives the text back', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		(global.fetch as Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: false,
				status: 403,
				headers: { get: (): string | null => null },
				json: (): Promise<unknown> => Promise.resolve(undefined)
			})
		);

		const sent = chatClient.sendChatMessage('room-f', 'not sent');
		await vi.advanceTimersByTimeAsync(0);

		await expect(sent).resolves.toBe(false);
		expect(useStore.getState().chatsRegistry['room-f']?.messages ?? []).toHaveLength(0);
	});

	it('keeps an unreachable send pending, retried by the SDK, instead of giving it back', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error('offline')));
		const settled = vi.fn();

		chatClient.sendChatMessage('room-f', 'queued').then(settled);
		await vi.advanceTimersByTimeAsync(0);

		expect(settled).not.toHaveBeenCalled();
		expect(useStore.getState().chatsRegistry['room-f'].messages).toHaveLength(1);
	});

	it('reads the last unread message before sending (v1 parity)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-rb', [
			createMockTextMessage({
				id: 'msg-unread',
				roomId: 'room-rb',
				from: 'user-2',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		mockJsonResponse(undefined);
		mockJsonResponse(
			buildMessage({
				id: 'msg-new',
				roomId: 'room-rb',
				senderId: 'me',
				text: 'rispondo',
				createdAt: AUG_FIRST_LATE_MORNING
			})
		);

		chatClient.sendChatMessage('room-rb', 'rispondo');
		await vi.advanceTimersByTimeAsync(0);

		const urls = (global.fetch as Mock).mock.calls.map((call) => call[0]);
		expect(urls[0]).toBe('/services/chats/rooms/room-rb/read');
		expect(urls[1]).toBe('/services/chats/rooms/room-rb/messages');
	});

	it('sends a reply through the SDK: replyToId on the wire, reply section hydrated end-to-end', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-rp', [
			createMockTextMessage({
				id: quotedId,
				stanzaId: quotedId,
				roomId: 'room-rp',
				from: 'user-2',
				text: 'testo citato',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		mockJsonResponse(undefined);
		mockJsonResponse(
			buildMessage({
				id: 'msg-reply',
				roomId: 'room-rp',
				senderId: 'me',
				text: 'rispondo',
				createdAt: AUG_FIRST_LATE_MORNING,
				replyToId: quotedId
			})
		);

		chatClient.sendChatMessageReply('room-rp', 'rispondo', 'user-2', quotedId);

		// The placeholder lands synchronously, already hydrated by the slice
		const pending = useStore.getState().chatsRegistry['room-rp'].messages[1];
		expect(pending).toMatchObject({
			text: 'rispondo',
			read: 'pending',
			replyTo: quotedId,
			repliedMessage: expect.objectContaining({ id: quotedId })
		});

		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-rp/read');
		expect(calls[1]?.[0]).toBe('/services/chats/rooms/room-rp/messages');
		expect(calls[1]?.[1]).toMatchObject({
			method: 'POST',
			body: JSON.stringify({ text: 'rispondo', tempId: pending.id, replyToId: quotedId })
		});
		// The REST confirmation keeps the reply fields the placeholder was rendering
		const { messages } = useStore.getState().chatsRegistry['room-rp'];
		expect(messages.map((message) => message.id)).toEqual([quotedId, 'msg-reply']);
		expect(messages[1]).toMatchObject({
			replyTo: quotedId,
			repliedMessage: expect.objectContaining({ id: quotedId, text: 'testo citato' })
		});
	});

	it('edits a message through the SDK: PUT on the wire, then the echo is a no-op on the fastening and rebuilds the sidebar', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const target = createMockTextMessage({
			id: editTargetId,
			stanzaId: editTargetId,
			roomId: 'room-ed',
			from: 'me',
			text: originalText,
			date: Date.parse(AUG_FIRST_MORNING)
		});
		useStore.getState().updateHistory('room-ed', [target]);
		useStore.getState().setLastMessage('room-ed', target);
		mockJsonResponse(
			buildMessage({
				id: editTargetId,
				roomId: 'room-ed',
				senderId: 'me',
				text: editedText,
				createdAt: AUG_FIRST_MORNING,
				editedInfo: { editedAt: AUG_FIRST_LATE_MORNING }
			})
		);

		chatClient.sendChatMessageEdit('room-ed', editedText, editTargetId, editTargetId);
		await vi.advanceTimersByTimeAsync(0);

		// No read-before-send and no optimistic write for edits (v1 parity):
		// the PUT is the first and only call
		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-ed/messages/msg-target/edit');
		expect(calls[0]?.[1]).toMatchObject({
			method: 'PUT',
			body: JSON.stringify({ text: editedText })
		});
		// The message keeps its original text: the UI projects the latest EDIT
		// fastening at render time (useMessage), exactly like v1 corrections
		expect(useStore.getState().chatsRegistry['room-ed'].messages[0]).toMatchObject({
			text: originalText
		});
		expect(useStore.getState().chatsRegistry['room-ed'].fastenings[editTargetId]).toEqual([
			expect.objectContaining({
				action: 'edit',
				originalStanzaId: editTargetId,
				value: editedText,
				from: 'me',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		// The REST path never touches the sidebar (a pre-PUT lookup could be
		// stale): still the original entry here
		expect(useStore.getState().chatsRegistry['room-ed'].lastMessage).toMatchObject({
			text: originalText
		});

		// The MessageEdited echo (the backend sends it to the editor too) builds
		// the same deterministic fastening id — the slice dedup makes it a no-op —
		// and owns the sidebar rebuild with its fresh router lookup
		wsChatEventsRouter(
			buildWsMessageEditedEvent({
				messageId: editTargetId,
				roomId: 'room-ed',
				text: editedText,
				editedAt: AUG_FIRST_LATE_MORNING
			})
		);
		expect(useStore.getState().chatsRegistry['room-ed'].fastenings[editTargetId]).toHaveLength(1);
		expect(useStore.getState().chatsRegistry['room-ed'].lastMessage).toMatchObject({
			edited: true,
			text: editedText
		});
	});

	it('deletes a message through the SDK: bare DELETE on the wire, the echo owns every store write', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const target = createMockTextMessage({
			id: 'msg-del',
			stanzaId: 'msg-del',
			roomId: 'room-del',
			from: 'me',
			text: 'da cancellare',
			date: Date.parse(AUG_FIRST_MORNING)
		});
		useStore.getState().updateHistory('room-del', [target]);
		useStore.getState().setLastMessage('room-del', target);
		mockJsonResponse(undefined);

		chatClient.sendChatMessageDeletion('room-del', 'msg-del');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-del/messages/msg-del');
		expect(calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
		// The 204 carries no server timestamp: no fastening, no sidebar write —
		// the store only moves on the echo below (v1 retraction parity)
		expect(useStore.getState().chatsRegistry['room-del'].fastenings['msg-del']).toBeUndefined();
		expect(useStore.getState().chatsRegistry['room-del'].lastMessage).toMatchObject({
			text: 'da cancellare'
		});

		wsChatEventsRouter(
			buildWsMessageDeletedEvent({
				messageId: 'msg-del',
				roomId: 'room-del',
				deletedBy: 'me',
				deletedAt: AUG_FIRST_LATE_MORNING
			})
		);
		expect(useStore.getState().chatsRegistry['room-del'].fastenings['msg-del']).toEqual([
			expect.objectContaining({ action: 'delete', originalStanzaId: 'msg-del' })
		]);
		expect(useStore.getState().chatsRegistry['room-del'].lastMessage).toMatchObject({
			deleted: true,
			text: ''
		});
	});

	it('reacts to a message through the SDK: PUT with the emoji in the body', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockJsonResponse(undefined);

		chatClient.sendChatMessageReaction('room-rx', 'msg-rx', '👨‍👩‍👧');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-rx/messages/msg-rx/reaction');
		expect(calls[0]?.[1]).toMatchObject({
			method: 'PUT',
			body: JSON.stringify({ reaction: '👨‍👩‍👧' })
		});
	});

	it('removes my single reaction without naming the emoji (v1 empty-value contract)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		// My active reaction lands from its own echo, the only confirmation path
		wsChatEventsRouter(
			buildWsReactionChangedEvent({
				messageId: 'msg-rm',
				roomId: 'room-rm',
				userId: 'me',
				reaction: '👍',
				operation: 'added'
			})
		);
		mockJsonResponse(undefined);

		chatClient.sendChatMessageReaction('room-rm', 'msg-rm', '');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-rm/messages/msg-rm/reaction');
		expect(calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
	});

	it('removing without an active reaction is a no-op (the v1 empty stanza did nothing there too)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		chatClient.sendChatMessageReaction('room-rn', 'msg-rn', '');
		await vi.advanceTimersByTimeAsync(0);

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('exposes the live XMPP features list against a legacy backend', () => {
		// De-negotiate: earlier tests in this file leave apiVersion at 2.0.0
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
		xmppClient.features = [PIN_FEATURE];

		expect(chatClient.features).toEqual([PIN_FEATURE]);

		xmppClient.features = [];
	});

	it('always exposes the pin feature on a WSC-pure backend (the disco gate is REST contract)', () => {
		useStore.getState().setApiVersion('2.0.0');
		xmppClient.features = [];

		expect(chatClient.features).toContain(PIN_FEATURE);
	});

	it('pins through the SDK on a WSC-pure backend: PUT, no optimistic write', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => undefined);
		mockJsonResponse(undefined);

		chatClient.pinMessage('room-p', 'msg-p');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-p/messages/msg-p/pin');
		expect(calls[0]?.[1]).toMatchObject({ method: 'PUT' });
		// The banner only lands with the MessagePinned echo (v1 parity)
		expect(useStore.getState().activeConversations['room-p']?.messagePinned).toBeUndefined();
		expect(spy).not.toHaveBeenCalled();
	});

	it('unpins through the SDK on a WSC-pure backend: DELETE (the optimistic removal is the hook)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const spy = vi.spyOn(xmppClient, 'unpinMessage').mockImplementation(() => undefined);
		mockJsonResponse(undefined);

		chatClient.unpinMessage('room-u', 'msg-u');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls[0]?.[0]).toBe('/services/chats/rooms/room-u/messages/msg-u/pin');
		expect(calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
		expect(spy).not.toHaveBeenCalled();
	});

	it('hydrates the pin banner store-first on getMessagePin (the full copy beats the stub)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().updateHistory('room-gp', [
			createMockTextMessage({
				id: 'msg-gp',
				stanzaId: 'msg-gp',
				roomId: 'room-gp',
				text: 'dal mio store',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		mockJsonResponse([
			buildPinnedMessage({
				messageId: 'msg-gp',
				roomId: 'room-gp',
				pinnedAt: AUG_FIRST_LATE_MORNING,
				message: buildWireMessage({
					id: 'msg-gp',
					roomId: 'room-gp',
					senderId: 'user-9',
					text: 'dal DTO'
				})
			})
		]);

		chatClient.getMessagePin('room-gp');
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-gp/pin');
		expect(useStore.getState().activeConversations['room-gp']?.messagePinned).toMatchObject({
			id: 'msg-gp',
			text: 'dal mio store'
		});
	});

	it('falls back to the DTO message, dated with its createdAt, when the pin target is off-window', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockJsonResponse([
			buildPinnedMessage({
				messageId: 'msg-off',
				roomId: 'room-goff',
				pinnedAt: AUG_FIRST_LATE_MORNING,
				message: buildWireMessage({
					id: 'msg-off',
					roomId: 'room-goff',
					senderId: 'user-9',
					text: 'testo remoto',
					createdAt: AUG_FIRST_MORNING
				})
			})
		]);

		chatClient.getMessagePin('room-goff');
		await vi.advanceTimersByTimeAsync(0);

		expect(useStore.getState().activeConversations['room-goff']?.messagePinned).toMatchObject({
			id: 'msg-off',
			text: 'testo remoto',
			from: 'user-9',
			date: Date.parse(AUG_FIRST_MORNING)
		});
	});

	it('clears a stale banner when the backend reports no pin (self-healing over the v1 no-op)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore
			.getState()
			.setPinnedMessage('room-gst', createMockTextMessage({ id: 'msg-stale', roomId: 'room-gst' }));
		mockJsonResponse([]);

		chatClient.getMessagePin('room-gst');
		await vi.advanceTimersByTimeAsync(0);

		expect(useStore.getState().activeConversations['room-gst']?.messagePinned).toBeUndefined();
	});

	it('skips getMessagePin for a placeholder room (F1, §9: GET /pin 404s on every mount)', () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setPlaceholderRoom('user-gp');

		chatClient.getMessagePin('placeholder-user-gp');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('sends the typing actions on the events socket on a WSC-pure backend', () => {
		useStore.getState().setApiVersion('2.0.0');
		const sendSpy = vi.spyOn(wsClient, 'send').mockImplementation(() => undefined);
		const xmppWriting = vi.spyOn(xmppClient, 'sendIsWriting').mockImplementation(() => undefined);
		const xmppPaused = vi.spyOn(xmppClient, 'sendPaused').mockImplementation(() => undefined);

		chatClient.sendIsWriting('room-w');
		chatClient.sendPaused('room-w');

		expect(sendSpy).toHaveBeenNthCalledWith(1, {
			action: 'Typing',
			roomId: 'room-w',
			status: 'started'
		});
		expect(sendSpy).toHaveBeenNthCalledWith(2, {
			action: 'Typing',
			roomId: 'room-w',
			status: 'stopped'
		});
		expect(xmppWriting).not.toHaveBeenCalled();
		expect(xmppPaused).not.toHaveBeenCalled();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('skips the typing actions for placeholder rooms (v1 stanza-path parity)', () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setPlaceholderRoom('user-w');
		const sendSpy = vi.spyOn(wsClient, 'send').mockImplementation(() => undefined);

		chatClient.sendIsWriting('placeholder-user-w');
		chatClient.sendPaused('placeholder-user-w');

		expect(sendSpy).not.toHaveBeenCalled();
	});

	it('searches the first page through the SDK with the cleared-history bound', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([
			createMockRoom({
				id: 'room-s',
				userSettings: { clearedAt: AUG_FIRST_LATE_MORNING, muted: false }
			})
		]);
		mockJsonResponse({
			messages: [
				// Older than clearedAt: the client-side notBefore bound drops it
				{
					id: 'msg-pre',
					roomId: 'room-s',
					senderId: 'user-2',
					text: 'vecchio',
					createdAt: AUG_FIRST_MORNING
				},
				{
					id: 'msg-hit',
					roomId: 'room-s',
					senderId: 'user-2',
					text: 'trovami',
					createdAt: AUG_FIRST_NOON
				}
			],
			hasMore: false
		});

		await expect(chatClient.fullTextSearch('room-s', 'trovami')).resolves.toBeUndefined();

		const url = (global.fetch as Mock).mock.calls[0]?.[0] as string;
		expect(url).toBe('/services/chats/rooms/room-s/messages/search?q=trovami&limit=50');
		expect(useStore.getState().chatsRegistry['room-s']?.searchResults).toEqual([
			expect.objectContaining({ id: 'msg-hit', stanzaId: 'msg-hit', text: 'trovami' })
		]);
		expect(useStore.getState().chatsRegistry['room-s']?.searchHasMore).toBe(false);
	});

	it('appends the next search page after the oldest result and stops when the server has no more', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-sp', createdAt: JULY_FIRST })]);
		const hit = (id: string, createdAt: string): Record<string, string> => ({
			id,
			roomId: 'room-sp',
			senderId: 'user-2',
			text: 'trovami',
			createdAt
		});
		mockJsonResponse({
			messages: [hit('msg-p1', '2026-08-01T12:00:00Z'), hit('msg-p2', AUG_FIRST_NOON)],
			hasMore: true
		});
		mockJsonResponse({
			messages: [hit('msg-p3', '2026-08-01T10:00:00Z')],
			hasMore: false
		});

		await chatClient.fullTextSearch('room-sp', 'trovami');
		expect(useStore.getState().chatsRegistry['room-sp']?.searchHasMore).toBe(true);

		await chatClient.fullTextSearchNextPage('room-sp', 'trovami');

		expect((global.fetch as Mock).mock.calls[1]?.[0]).toBe(
			'/services/chats/rooms/room-sp/messages/search?q=trovami&limit=50&before=2026-08-01T11%3A00%3A00.000000Z&beforeId=msg-p2'
		);
		const registry = useStore.getState().chatsRegistry['room-sp'];
		expect(registry?.searchResults.map((result) => result.id)).toEqual([
			'msg-p1',
			'msg-p2',
			'msg-p3'
		]);
		expect(registry?.searchHasMore).toBe(false);
	});

	it('ends the search paging on a page that adds nothing, whatever hasMore says', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-sz', createdAt: JULY_FIRST })]);
		useStore
			.getState()
			.setSearchResults('room-sz', [
				createMockTextMessage({ id: 'msg-sz', stanzaId: 'msg-sz', roomId: 'room-sz' })
			]);
		useStore.getState().setSearchHasMore('room-sz', true);
		mockJsonResponse({ messages: [], hasMore: true });

		await chatClient.fullTextSearchNextPage('room-sz', 'x');

		expect(useStore.getState().chatsRegistry['room-sz']?.searchHasMore).toBe(false);
	});

	it('asks no further search page without results in store', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-sn' })]);

		await chatClient.fullTextSearchNextPage('room-sn', 'x');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('rejects the search on a definitive error, leaving the panel snackbar path intact', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-se' })]);
		(global.fetch as Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: false,
				status: 500,
				headers: { get: (): string | null => null },
				json: (): Promise<unknown> => Promise.resolve(undefined)
			})
		);

		await expect(chatClient.fullTextSearch('room-se', 'boom')).rejects.toThrow();
		expect(useStore.getState().chatsRegistry['room-se']?.searchResults ?? []).toEqual([]);
	});

	it('replaces the room window with the page around the jump target in one request', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore
			.getState()
			.addRooms([createMockRoom({ id: jumpRoomId, createdAt: AUG_FIRST_MORNING })]);
		useStore.getState().updateHistory(jumpRoomId, [
			createMockTextMessage({
				id: jumpRecentId,
				stanzaId: jumpRecentId,
				roomId: jumpRoomId,
				date: Date.parse('2026-08-01T12:00:00Z')
			})
		]);
		useStore.getState().setHistoryIsFullyLoaded(jumpRoomId);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: jumpTargetId,
							roomId: jumpRoomId,
							createdAt: '2026-08-01T09:30:00Z'
						})
					),
					buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-after-target',
							roomId: jumpRoomId,
							createdAt: '2026-08-01T09:45:00Z'
						})
					)
				],
				{ hasMoreBefore: true, hasMoreAfter: true }
			)
		);

		await expect(
			chatClient.requestMessageResultHistoryToId(
				jumpRoomId,
				jumpTargetId,
				Date.parse('2026-08-01T09:30:00Z')
			)
		).resolves.toBeUndefined();

		const calls = (global.fetch as Mock).mock.calls.map((call) => call[0] as string);
		expect(calls).toEqual([
			`/services/chats/rooms/room-j/timeline?around=2026-08-01T09%3A30%3A00.000000Z&aroundId=${jumpTargetId}&limit=50`
		]);
		const registry = useStore.getState().chatsRegistry[jumpRoomId];
		// The old window is not contiguous with the new one: it is dropped
		expect(registry?.messages.map((message) => message.id)).toEqual([
			jumpTargetId,
			'msg-after-target'
		]);
		expect(registry?.hasMoreAfter).toBe(true);
		const conversation = useStore.getState().activeConversations[jumpRoomId];
		expect(conversation?.isHistoryFullyLoaded).toBe(false);
		expect(conversation?.isHistoryLoadDisabled).toBe(false);
		expect(conversation?.scrollPositionMessageId).toBe(jumpTargetId);
	});

	it('keeps an unconfirmed send across the jump', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-jp', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-jp', [
			createMockTextMessage({
				id: pendingId,
				stanzaId: `${PLACEHOLDER_STANZA_PREFIX}${pendingId}`,
				roomId: 'room-jp',
				date: Date.parse(AUG_FIRST_MORNING),
				read: MarkerStatus.PENDING
			}),
			createMockTextMessage({
				id: 'msg-real',
				stanzaId: 'msg-real',
				roomId: 'room-jp',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: jumpTargetId,
							roomId: 'room-jp',
							createdAt: AUG_FIRST_EARLY
						})
					)
				],
				{ hasMoreBefore: true, hasMoreAfter: true }
			)
		);

		await chatClient.requestMessageResultHistoryToId(
			'room-jp',
			jumpTargetId,
			Date.parse(AUG_FIRST_EARLY)
		);

		expect(
			useStore.getState().chatsRegistry['room-jp']?.messages.map((message) => message.id)
		).toEqual([jumpTargetId, pendingId]);
	});

	it('takes the date of the jump target from the search results or the pinned message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-jd', createdAt: JULY_FIRST })]);
		useStore.getState().setSearchResults('room-jd', [
			createMockTextMessage({
				id: 'msg-hit',
				stanzaId: 'msg-hit',
				roomId: 'room-jd',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: false, hasMoreAfter: false }));

		await chatClient.requestMessageResultHistoryToId('room-jd', 'msg-hit');

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-jd/timeline?around=2026-08-01T10%3A00%3A00.000000Z&aroundId=msg-hit&limit=50'
		);
	});

	it('leaves the window alone when the date of the jump target is unknown', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		useStore.getState().addRooms([createMockRoom({ id: 'room-ju', createdAt: JULY_FIRST })]);
		useStore
			.getState()
			.updateHistory('room-ju', [
				createMockTextMessage({ id: 'msg-keep', stanzaId: 'msg-keep', roomId: 'room-ju' })
			]);

		await chatClient.requestMessageResultHistoryToId('room-ju', 'msg-ghost');

		expect(global.fetch).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(
			'chatClient.requestMessageResultHistoryToId: unknown message date',
			'msg-ghost'
		);
		expect(useStore.getState().chatsRegistry['room-ju']?.messages).toHaveLength(1);
		expect(useStore.getState().chatsRegistry['room-ju']?.hasMoreAfter).toBeFalsy();
	});

	it('attaches the window again when the page around the target ends at the newest message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-ja', createdAt: JULY_FIRST })]);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({ id: 'msg-near', roomId: 'room-ja', createdAt: AUG_FIRST_MORNING })
					)
				],
				{ hasMoreBefore: false, hasMoreAfter: false }
			)
		);

		await chatClient.requestMessageResultHistoryToId(
			'room-ja',
			'msg-near',
			Date.parse(AUG_FIRST_MORNING)
		);

		expect(useStore.getState().chatsRegistry['room-ja']?.hasMoreAfter).toBe(false);
		expect(useStore.getState().activeConversations['room-ja']?.isHistoryFullyLoaded).toBe(true);
	});

	it('restores the latest page and rejects when the page around the target cannot be loaded', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		useStore.getState().addRooms([createMockRoom({ id: 'room-jr', createdAt: JULY_FIRST })]);
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({ id: 'msg-latest', roomId: 'room-jr', createdAt: AUG_FIRST_MORNING })
					)
				],
				{ hasMoreBefore: true }
			)
		);

		await expect(
			chatClient.requestMessageResultHistoryToId('room-jr', 'msg-x', Date.parse(JULY_FIRST))
		).rejects.toThrow(BACKEND_DOWN);

		const calls = (global.fetch as Mock).mock.calls.map((call) => call[0] as string);
		expect(calls[1]).toBe('/services/chats/rooms/room-jr/timeline?limit=50');
		const registry = useStore.getState().chatsRegistry['room-jr'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-latest']);
		expect(registry?.hasMoreAfter).toBe(false);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('skips every round-trip when the jump target is already loaded', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-jl' })]);
		useStore.getState().updateHistory('room-jl', [
			createMockTextMessage({
				id: 'msg-here',
				stanzaId: 'msg-here',
				roomId: 'room-jl',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);

		await chatClient.requestMessageResultHistoryToId('room-jl', 'msg-here');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('loads the page after the newest confirmed row until the window reaches the newest message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-f', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-f', [
			createMockTextMessage({
				id: 'msg-f1',
				stanzaId: 'msg-f1',
				roomId: 'room-f',
				date: Date.parse(AUG_FIRST_MORNING)
			}),
			createMockTextMessage({
				id: pendingId,
				stanzaId: `${PLACEHOLDER_STANZA_PREFIX}${pendingId}`,
				roomId: 'room-f',
				date: Date.parse('2026-08-01T07:00:00Z'),
				read: MarkerStatus.PENDING
			})
		]);
		useStore.getState().setHasMoreAfter('room-f', true);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({ id: 'msg-f2', roomId: 'room-f', createdAt: AUG_FIRST_LATE_MORNING })
					)
				],
				{ hasMoreBefore: true, hasMoreAfter: true }
			)
		);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-f3',
							roomId: 'room-f',
							createdAt: AUG_FIRST_NOON
						})
					)
				],
				{ hasMoreBefore: true, hasMoreAfter: false }
			)
		);

		await chatClient.requestMessagesAfter('room-f');

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-f/timeline?after=2026-08-01T09%3A00%3A00.000000Z&afterId=msg-f1&limit=50'
		);
		expect(useStore.getState().chatsRegistry['room-f']?.hasMoreAfter).toBe(true);

		await chatClient.requestMessagesAfter('room-f');

		expect((global.fetch as Mock).mock.calls[1]?.[0]).toContain('afterId=msg-f2');
		const registry = useStore.getState().chatsRegistry['room-f'];
		expect(registry?.hasMoreAfter).toBe(false);
		expect(registry?.messages.map((message) => message.id)).toEqual([
			'msg-f1',
			'msg-f2',
			'msg-f3',
			pendingId
		]);
		expect(useStore.getState().activeConversations['room-f']?.isHistoryFullyLoaded).toBeFalsy();
	});

	it('does not page forward once the window is attached', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-fa', createdAt: JULY_FIRST })]);
		useStore
			.getState()
			.updateHistory('room-fa', [
				createMockTextMessage({ id: 'msg-fa', stanzaId: 'msg-fa', roomId: 'room-fa' })
			]);

		await chatClient.requestMessagesAfter('room-fa');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('does not spin on a forward page that moves nothing', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		useStore.getState().addRooms([createMockRoom({ id: 'room-fs', createdAt: JULY_FIRST })]);
		useStore
			.getState()
			.updateHistory('room-fs', [
				createMockTextMessage({ id: 'msg-fs', stanzaId: 'msg-fs', roomId: 'room-fs' })
			]);
		useStore.getState().setHasMoreAfter('room-fs', true);
		mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true, hasMoreAfter: true }));

		await chatClient.requestMessagesAfter('room-fs');

		expect(warnSpy).toHaveBeenCalledWith(
			'chatClient.requestMessagesAfter: pagination stalled',
			'room-fs'
		);
		expect(useStore.getState().chatsRegistry['room-fs']?.hasMoreAfter).toBe(true);
	});

	it('reloads the latest page and attaches the window again, once for concurrent calls', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-l', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-l', [
			createMockTextMessage({
				id: 'msg-old-window',
				stanzaId: 'msg-old-window',
				roomId: 'room-l'
			})
		]);
		useStore.getState().setHasMoreAfter('room-l', true);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: NEWEST_ID,
							roomId: 'room-l',
							createdAt: AUG_FIRST_LATE_MORNING
						})
					)
				],
				{ hasMoreBefore: true, hasMoreAfter: false }
			)
		);

		await Promise.all([
			chatClient.returnToLatestMessages('room-l'),
			chatClient.returnToLatestMessages('room-l')
		]);

		expect((global.fetch as Mock).mock.calls).toHaveLength(1);
		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-l/timeline?limit=50'
		);
		const registry = useStore.getState().chatsRegistry['room-l'];
		expect(registry?.hasMoreAfter).toBe(false);
		expect(registry?.messages.map((message) => message.id)).toEqual([NEWEST_ID]);
		expect(useStore.getState().activeConversations['room-l']?.scrollPositionMessageId).toBe(
			NEWEST_ID
		);
	});

	it('makes no request to return to the latest page of an attached window', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-la', createdAt: JULY_FIRST })]);

		await chatClient.returnToLatestMessages('room-la');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('does not append a live message to a window cut before the newest message, but counts it unread', () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().addRooms([createMockRoom({ id: 'room-ld', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-ld', [
			createMockTextMessage({
				id: 'msg-ld',
				stanzaId: 'msg-ld',
				roomId: 'room-ld',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		useStore.getState().setHasMoreAfter('room-ld', true);

		wsChatEventsRouter(
			buildWsMessageReceivedEvent(
				buildWireMessage({
					id: 'msg-live',
					roomId: 'room-ld',
					senderId: 'user-2',
					text: 'nuovo',
					createdAt: AUG_FIRST_LATE_MORNING
				})
			)
		);

		const registry = useStore.getState().chatsRegistry['room-ld'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-ld']);
		expect(registry?.unread).toBe(1);
	});

	it('returns to the latest page before sending from a window cut before the newest message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().addRooms([createMockRoom({ id: 'room-sd', createdAt: JULY_FIRST })]);
		useStore
			.getState()
			.updateHistory('room-sd', [
				createMockTextMessage({ id: 'msg-sd', stanzaId: 'msg-sd', roomId: 'room-sd' })
			]);
		useStore.getState().setHasMoreAfter('room-sd', true);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({ id: 'msg-sd-new', roomId: 'room-sd', createdAt: AUG_FIRST_MORNING })
					)
				],
				{ hasMoreBefore: true }
			)
		);
		mockJsonResponse(
			buildWireMessage({ id: 'msg-sent', roomId: 'room-sd', senderId: 'me', text: 'ciao' })
		);

		const sent = chatClient.sendChatMessage('room-sd', 'ciao');
		await vi.advanceTimersByTimeAsync(0);
		await sent;

		const calls = (global.fetch as Mock).mock.calls.map((call) => call[0] as string);
		const timelineIndex = calls.indexOf('/services/chats/rooms/room-sd/timeline?limit=50');
		const sendIndex = calls.findIndex((url) => url.endsWith('/rooms/room-sd/messages'));
		expect(timelineIndex).toBeGreaterThanOrEqual(0);
		expect(sendIndex).toBeGreaterThan(timelineIndex);
		expect(useStore.getState().chatsRegistry['room-sd']?.hasMoreAfter).toBe(false);
	});

	it('drops the backward page asked from a window that was replaced meanwhile', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-q', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-q', [
			createMockTextMessage({
				id: 'msg-q-old',
				stanzaId: 'msg-q-old',
				roomId: 'room-q',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		let releaseAroundPage: () => void = () => undefined;
		(global.fetch as Mock).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					releaseAroundPage = (): void =>
						resolve({
							ok: true,
							status: 200,
							headers: { get: (): string | null => 'application/json' },
							json: (): Promise<unknown> =>
								Promise.resolve(
									buildTimelineResponse(
										[
											buildMessageTimelineItem(
												buildWireMessage({
													id: 'msg-q-target',
													roomId: 'room-q',
													createdAt: JULY_FIRST
												})
											)
										],
										{ hasMoreBefore: true, hasMoreAfter: true }
									)
								),
							blob: (): Promise<unknown> => Promise.resolve(undefined)
						});
				})
		);

		const jump = chatClient.requestMessageResultHistoryToId(
			'room-q',
			'msg-q-target',
			Date.parse(JULY_FIRST)
		);
		await vi.advanceTimersByTimeAsync(0);
		// The loader asks while the window is being replaced: its anchor belongs to the old window
		chatClient.requestHistory('room-q', Date.now());
		releaseAroundPage();
		await jump;
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls).toHaveLength(1);
		expect(useStore.getState().activeConversations['room-q']?.isHistoryLoadDisabled).toBe(false);
	});

	it('exports the chat as a server-streamed download on a WSC-pure backend', () => {
		vi.mocked(downloadChatExport).mockResolvedValue(undefined);
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-exp', name: 'Weekly sync' })]);
		const xmppSpy = vi.spyOn(xmppClient, 'requestFullHistory').mockImplementation(() => undefined);

		chatClient.requestFullHistory('room-exp');

		// Naming is resolved inside downloadChatExport itself (resolveChatExportName,
		// unit-tested on its own); the MAM accumulation loop never starts
		expect(downloadChatExport).toHaveBeenCalledWith('room-exp');
		expect(xmppSpy).not.toHaveBeenCalled();
	});
});
