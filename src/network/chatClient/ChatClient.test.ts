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

import { chatClient, isWscPure, REATTACH_CALLER_DEADLINE_MS } from './ChatClient';
import { downloadChatExport } from './chatExportDownload';
import { BOOT_INBOX_TIMEOUT_MS, refreshInboxSerialized } from './inboxRefresh';
import { WINDOW_LOAD_TIMEOUT_MS } from './windowGuard';
import { PLACEHOLDER_STANZA_PREFIX } from '../../constants/messageConstants';
import useStore from '../../store/Store';
import {
	buildWsMessageDeletedEvent,
	buildWsMessageEditedEvent,
	buildWsMessageReceivedEvent,
	buildWsReactionChangedEvent,
	buildWsReadUpdatedEvent
} from '../../tests/buildWsChatEvent';
import {
	createMockConfigurationMessage,
	createMockRoom,
	createMockTextMessage,
	createMockUser
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

const AUG_FIRST_TWELVE_ONE = '2026-08-01T12:00:01Z';
const AUG_FIRST_TWELVE = '2026-08-01T12:00:00Z';
const AUG_SECOND = '2026-08-02T00:00:00Z';
const CONTENT_TYPE = 'content-type';
const JSON_TYPE = 'application/json';

function jsonResponse(body: unknown): unknown {
	return {
		ok: true,
		status: 200,
		headers: {
			get: (name: string): string | null => (name.toLowerCase() === CONTENT_TYPE ? JSON_TYPE : null)
		},
		json: (): Promise<unknown> => Promise.resolve(body),
		blob: (): Promise<unknown> => Promise.resolve(undefined)
	};
}

/** The next request stays open until the returned function answers it. */
function deferResponse(): (body: unknown) => void {
	let answer = (body: unknown): void => {
		expect(body).toBeUndefined();
	};
	(global.fetch as Mock).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				answer = (body): void => resolve(jsonResponse(body));
			})
	);
	return (body): void => answer(body);
}

function mockJsonResponse(body: unknown): void {
	(global.fetch as Mock).mockImplementationOnce(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			headers: {
				get: (name: string): string | null =>
					name.toLowerCase() === CONTENT_TYPE ? JSON_TYPE : null
			},
			json: (): Promise<unknown> => Promise.resolve(body),
			blob: (): Promise<unknown> => Promise.resolve(undefined)
		})
	);
}

/** The page that follows the attach of a window: nothing was committed meanwhile. */
function mockEmptyAfterPage(): void {
	mockJsonResponse(buildTimelineResponse([], { hasMoreBefore: true, hasMoreAfter: false }));
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

		chatClient.requestHistory('room-t', Date.parse(AUG_SECOND));
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

		chatClient.requestHistory('room-po', Date.parse(AUG_SECOND));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-po/timeline?limit=50'
		);
	});

	it('logs a failing history page and enables the loader again so it can ask again', async () => {
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
		// Every outcome enables it: a conversation must not stay without history after one failure
		expect(useStore.getState().activeConversations['room-err']?.isHistoryLoadDisabled).toBe(false);
	});

	it('enables the history loader again when the first page of a conversation times out', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-slow', createdAt: JULY_FIRST })]);
		useStore.getState().setHistoryLoadDisabled('room-slow', true);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		deferResponse();

		chatClient.requestHistory('room-slow', Date.parse(AUG_FIRST_MORNING));
		await vi.advanceTimersByTimeAsync(WINDOW_LOAD_TIMEOUT_MS);

		expect(errorSpy).toHaveBeenCalledWith(
			'chatClient.requestHistory: timeline hydration failed',
			expect.objectContaining({ name: 'TimeoutError' })
		);
		expect(useStore.getState().activeConversations['room-slow']?.isHistoryLoadDisabled).toBe(false);
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
									name.toLowerCase() === CONTENT_TYPE ? JSON_TYPE : null
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
			messages: [hit('msg-p1', AUG_FIRST_TWELVE), hit('msg-p2', AUG_FIRST_NOON)],
			hasMore: true
		});
		mockJsonResponse({
			messages: [hit('msg-p3', AUG_FIRST_LATE_MORNING)],
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
				date: Date.parse(AUG_FIRST_TWELVE)
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
		).resolves.toBe(true);

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
		mockEmptyAfterPage();

		await chatClient.requestMessageResultHistoryToId(
			'room-ja',
			'msg-near',
			Date.parse(AUG_FIRST_MORNING)
		);

		expect(useStore.getState().chatsRegistry['room-ja']?.hasMoreAfter).toBe(false);
		expect(useStore.getState().activeConversations['room-ja']?.isHistoryFullyLoaded).toBe(true);
	});

	it('leaves the window as it was and rejects when the page around the target cannot be loaded', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-jr', createdAt: JULY_FIRST })]);
		useStore.getState().updateHistory('room-jr', [
			createMockTextMessage({
				id: 'msg-kept',
				stanzaId: 'msg-kept',
				roomId: 'room-jr',
				date: Date.parse(AUG_FIRST_MORNING)
			})
		]);
		useStore.getState().setScrollPosition('room-jr', 'msg-kept');
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));

		await expect(
			chatClient.requestMessageResultHistoryToId('room-jr', 'msg-x', Date.parse(JULY_FIRST))
		).rejects.toThrow(BACKEND_DOWN);

		// One request, no restore: nothing was cleared
		expect((global.fetch as Mock).mock.calls).toHaveLength(1);
		const registry = useStore.getState().chatsRegistry['room-jr'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-kept']);
		expect(registry?.hasMoreAfter).toBeFalsy();
		expect(useStore.getState().activeConversations['room-jr']?.scrollPositionMessageId).toBe(
			'msg-kept'
		);
		expect(useStore.getState().activeConversations['room-jr']?.isHistoryLoadDisabled).toBe(false);
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
		mockEmptyAfterPage();

		await chatClient.requestMessagesAfter('room-f');

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe(
			'/services/chats/rooms/room-f/timeline?after=2026-08-01T09%3A00%3A00.000000Z&afterId=msg-f1&limit=50'
		);
		expect(useStore.getState().chatsRegistry['room-f']?.hasMoreAfter).toBe(true);

		await chatClient.requestMessagesAfter('room-f');

		expect((global.fetch as Mock).mock.calls[1]?.[0]).toContain('afterId=msg-f2');
		// The window is attached: the page after its newest row catches what was committed meanwhile
		expect((global.fetch as Mock).mock.calls[2]?.[0]).toContain('afterId=msg-f3');
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
		mockEmptyAfterPage();

		await Promise.all([
			chatClient.returnToLatestMessages('room-l'),
			chatClient.returnToLatestMessages('room-l')
		]);

		// The latest page, then the page after its newest row: once for the two calls
		expect((global.fetch as Mock).mock.calls).toHaveLength(2);
		expect((global.fetch as Mock).mock.calls[1]?.[0]).toBe(
			`/services/chats/rooms/room-l/timeline?after=2026-08-01T10%3A00%3A00.000000Z&afterId=${NEWEST_ID}&limit=50`
		);
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
		mockEmptyAfterPage();
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
							headers: { get: (): string | null => JSON_TYPE },
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

	describe('window loads racing with live events, resets and queries', () => {
		const setUpRoom = (
			id: string,
			extra: Partial<Parameters<typeof createMockRoom>[0]> = {}
		): void => {
			useStore.getState().setApiVersion('2.0.0');
			useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
			useStore.getState().addRooms([createMockRoom({ id, createdAt: JULY_FIRST, ...extra })]);
		};
		const rowIds = (id: string): Array<string> =>
			useStore.getState().chatsRegistry[id]?.messages.map((message) => message.id) ?? [];
		const row = (roomId: string, id: string, createdAt: string): unknown =>
			buildMessageTimelineItem(buildWireMessage({ id, roomId, createdAt }));
		const liveEvent = (roomId: string, id: string, createdAt: string): void =>
			wsChatEventsRouter(
				buildWsMessageReceivedEvent(buildWireMessage({ id, roomId, senderId: 'u2', createdAt }))
			);
		const seedWindow = (roomId: string, id = 'w1'): void => {
			useStore
				.getState()
				.updateHistory(roomId, [
					createMockTextMessage({ id, stanzaId: id, roomId, date: Date.parse(AUG_FIRST_EARLY) })
				]);
			useStore.getState().setHasMoreAfter(roomId, true);
		};

		it('reads again what was committed while the latest page was in flight', async () => {
			setUpRoom('room-ra');
			seedWindow('room-ra', 'old');
			const answer = deferResponse();
			const reload = chatClient.returnToLatestMessages('room-ra');
			await vi.advanceTimersByTimeAsync(0);

			// Committed after the server read the page, its event arrives before the page is processed
			liveEvent('room-ra', 'live', AUG_FIRST_TWELVE_ONE);
			answer(
				buildTimelineResponse([row('room-ra', 'snap', AUG_FIRST_TWELVE) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockJsonResponse(
				buildTimelineResponse([row('room-ra', 'live', AUG_FIRST_TWELVE_ONE) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			await reload;
			liveEvent('room-ra', 'live2', '2026-08-01T12:00:02Z');

			const timelineCalls = (global.fetch as Mock).mock.calls
				.map((call) => call[0] as string)
				.filter((url) => url.includes('/timeline?'));
			expect(timelineCalls[1]).toContain('afterId=snap');
			expect(rowIds('room-ra')).toEqual(['snap', 'live', 'live2']);
			expect(useStore.getState().chatsRegistry['room-ra']?.hasMoreAfter).toBe(false);
		});

		it('reads again what was committed while the last forward page was in flight', async () => {
			setUpRoom('room-rf');
			seedWindow('room-rf');
			const answer = deferResponse();
			const next = chatClient.requestMessagesAfter('room-rf');
			await vi.advanceTimersByTimeAsync(0);

			liveEvent('room-rf', 'live', AUG_FIRST_TWELVE_ONE);
			answer(
				buildTimelineResponse([row('room-rf', 'f1', AUG_FIRST_TWELVE) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockJsonResponse(
				buildTimelineResponse([row('room-rf', 'live', AUG_FIRST_TWELVE_ONE) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			await next;

			expect(rowIds('room-rf')).toEqual(['w1', 'f1', 'live']);
		});

		it('keeps paging after the attach while the catch-up has more, from the newest row of the page', async () => {
			setUpRoom('room-rm');
			seedWindow('room-rm');
			mockJsonResponse(
				buildTimelineResponse([row('room-rm', 'f1', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockJsonResponse(
				buildTimelineResponse([row('room-rm', 'c1', AUG_FIRST_LATE_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			mockJsonResponse(
				buildTimelineResponse([row('room-rm', 'c2', AUG_FIRST_NOON) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);

			await chatClient.requestMessagesAfter('room-rm');

			const calls = (global.fetch as Mock).mock.calls.map((call) => call[0] as string);
			expect(calls[1]).toContain('afterId=f1');
			expect(calls[2]).toContain('afterId=c1');
			expect(rowIds('room-rm')).toEqual(['w1', 'f1', 'c1', 'c2']);
			expect(useStore.getState().chatsRegistry['room-rm']?.hasMoreAfter).toBe(false);
		});

		it('detaches the window again when the catch-up pages run out', async () => {
			setUpRoom('room-rx');
			seedWindow('room-rx');
			mockJsonResponse(
				buildTimelineResponse([row('room-rx', 'f0', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			Array.from({ length: 10 }, (_, index) => index).forEach((index) =>
				mockJsonResponse(
					buildTimelineResponse(
						[row('room-rx', `c${index}`, `2026-08-01T10:${String(10 + index)}:00Z`) as never],
						{ hasMoreBefore: true, hasMoreAfter: true }
					)
				)
			);

			await chatClient.requestMessagesAfter('room-rx');

			expect((global.fetch as Mock).mock.calls).toHaveLength(11);
			expect(useStore.getState().chatsRegistry['room-rx']?.hasMoreAfter).toBe(true);
		});

		it('brings back an own message confirmed while the window was detached with the after pages', async () => {
			setUpRoom('room-rb');
			useStore.getState().setPlaceholderMessage({ roomId: 'room-rb', id: 'tmp-1', text: 'hello' });
			useStore.getState().replaceHistory('room-rb', []);
			seedWindow('room-rb');
			expect(rowIds('room-rb')).toEqual(['w1', 'tmp-1']);

			wsChatEventsRouter(
				buildWsMessageReceivedEvent(
					buildWireMessage({
						id: 'srv-1',
						roomId: 'room-rb',
						senderId: 'me',
						text: 'hello',
						createdAt: AUG_FIRST_TWELVE
					}),
					{ tempId: 'tmp-1' }
				)
			);
			expect(rowIds('room-rb')).toEqual(['w1']);

			mockJsonResponse(
				buildTimelineResponse([row('room-rb', 'srv-1', AUG_FIRST_TWELVE) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockEmptyAfterPage();
			await chatClient.requestMessagesAfter('room-rb');

			expect(rowIds('room-rb')).toEqual(['w1', 'srv-1']);
		});

		it('ignores a target below the cleared-history floor without touching the window', async () => {
			setUpRoom('room-rg', { userSettings: { clearedAt: '2026-08-10T00:00:00Z', muted: false } });
			useStore.getState().updateHistory('room-rg', [
				createMockTextMessage({
					id: 'visible',
					stanzaId: 'visible',
					roomId: 'room-rg',
					date: Date.parse('2026-08-20T08:00:00Z')
				})
			]);

			const loaded = await chatClient.requestMessageResultHistoryToId(
				'room-rg',
				'pinned',
				Date.parse(AUG_FIRST_EARLY)
			);

			expect(loaded).toBe(false);
			expect(global.fetch).not.toHaveBeenCalled();
			expect(rowIds('room-rg')).toEqual(['visible']);
			expect(useStore.getState().chatsRegistry['room-rg']?.hasMoreAfter).toBeFalsy();
		});

		it('keeps the page around the target as the window when the target is not in it, and says so', async () => {
			setUpRoom('room-rn');
			mockJsonResponse(
				buildTimelineResponse([row('room-rn', 'near', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);

			const loaded = await chatClient.requestMessageResultHistoryToId(
				'room-rn',
				'deleted-target',
				Date.parse(AUG_FIRST_MORNING)
			);

			expect(loaded).toBe(false);
			expect(rowIds('room-rn')).toEqual(['near']);
			expect(useStore.getState().chatsRegistry['room-rn']?.hasMoreAfter).toBe(true);
		});

		it('discards a forward page that answers after a reconnection reset, keeping the live events', async () => {
			setUpRoom('room-rr');
			seedWindow('room-rr');
			const answer = deferResponse();
			const next = chatClient.requestMessagesAfter('room-rr');
			await vi.advanceTimersByTimeAsync(0);

			useStore.getState().resetXmppData();
			liveEvent('room-rr', 'live', '2026-08-05T12:00:00Z');
			wsChatEventsRouter(
				buildWsReactionChangedEvent({
					roomId: 'room-rr',
					messageId: 'live',
					userId: 'u2',
					reaction: '👍'
				})
			);
			answer(
				buildTimelineResponse([row('room-rr', 'f1', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			await expect(next).resolves.toBeUndefined();

			expect(rowIds('room-rr')).toEqual(['live']);
			expect(useStore.getState().chatsRegistry['room-rr']?.hasMoreAfter).toBeFalsy();
			// A live reaction written while a stale load was in flight is a real one
			expect(
				useStore.getState().chatsRegistry['room-rr']?.fastenings.live?.map((f) => f.value)
			).toEqual(['👍']);
		});

		it('discards a jump page that answers after a history clear', async () => {
			setUpRoom('room-rc');
			const answer = deferResponse();
			const jump = chatClient.requestMessageResultHistoryToId(
				'room-rc',
				'target',
				Date.parse(AUG_FIRST_MORNING)
			);
			await vi.advanceTimersByTimeAsync(0);

			useStore.getState().clearConversation('room-rc', AUG_SECOND);
			answer(
				buildTimelineResponse([row('room-rc', 'target', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			await expect(jump).resolves.toBe(false);

			expect(rowIds('room-rc')).toEqual([]);
			expect(useStore.getState().chatsRegistry['room-rc']?.hasMoreAfter).toBeFalsy();
		});

		it('drops the first page of an old query that answers after a new query started', async () => {
			setUpRoom('room-re');
			const answerFoo = deferResponse();
			const first = chatClient.fullTextSearch('room-re', 'foo');
			await vi.advanceTimersByTimeAsync(0);
			mockJsonResponse({
				messages: [buildWireMessage({ id: 'bar-1', roomId: 'room-re', createdAt: AUG_FIRST_NOON })],
				hasMore: true
			});
			await chatClient.fullTextSearch('room-re', 'bar');

			answerFoo({
				messages: [
					buildWireMessage({ id: 'foo-1', roomId: 'room-re', createdAt: AUG_FIRST_MORNING })
				],
				hasMore: false
			});
			await first;

			const registry = useStore.getState().chatsRegistry['room-re'];
			expect(registry?.searchResults.map((result) => result.id)).toEqual(['bar-1']);
			expect(registry?.searchHasMore).toBe(true);
		});

		it('drops a next page of an old query even when the new query already asked its own', async () => {
			setUpRoom('room-rq');
			const hit = (id: string, createdAt: string): Record<string, string> => ({
				id,
				roomId: 'room-rq',
				senderId: 'user-2',
				text: 'x',
				createdAt
			});
			mockJsonResponse({ messages: [hit('foo-1', AUG_FIRST_NOON)], hasMore: true });
			await chatClient.fullTextSearch('room-rq', 'foo');
			const answerFoo = deferResponse();
			const oldNext = chatClient.fullTextSearchNextPage('room-rq', 'foo');
			await vi.advanceTimersByTimeAsync(0);

			mockJsonResponse({ messages: [hit('bar-1', AUG_FIRST_NOON)], hasMore: true });
			await chatClient.fullTextSearch('room-rq', 'bar');
			const answerBar = deferResponse();
			const newNext = chatClient.fullTextSearchNextPage('room-rq', 'bar');
			await vi.advanceTimersByTimeAsync(0);
			answerBar({ messages: [hit('bar-2', AUG_FIRST_MORNING)], hasMore: false });
			await newNext;
			answerFoo({ messages: [hit('foo-2', AUG_FIRST_EARLY)], hasMore: true });
			await oldNext;

			const registry = useStore.getState().chatsRegistry['room-rq'];
			expect(registry?.searchResults.map((result) => result.id)).toEqual(['bar-1', 'bar-2']);
			expect(registry?.searchHasMore).toBe(false);
		});

		it('drops a late search page after the results were cleared', async () => {
			setUpRoom('room-rd');
			const answer = deferResponse();
			const first = chatClient.fullTextSearch('room-rd', 'foo');
			await vi.advanceTimersByTimeAsync(0);

			useStore.getState().clearSearchResults('room-rd');
			answer({
				messages: [
					buildWireMessage({ id: 'foo-1', roomId: 'room-rd', createdAt: AUG_FIRST_MORNING })
				],
				hasMore: true
			});
			await first;

			expect(useStore.getState().chatsRegistry['room-rd']?.searchResults).toEqual([]);
		});

		it('keeps the window while the page around the target is in flight and swaps it, with the scroll target, when it lands', async () => {
			setUpRoom('room-ra1');
			useStore.getState().updateHistory('room-ra1', [
				createMockTextMessage({
					id: 'old-row',
					stanzaId: 'old-row',
					roomId: 'room-ra1',
					date: Date.parse(AUG_FIRST_EARLY)
				})
			]);
			useStore.getState().setScrollPosition('room-ra1', 'old-row');
			const answer = deferResponse();
			const jump = chatClient.requestMessageResultHistoryToId(
				'room-ra1',
				'target',
				Date.parse(AUG_FIRST_MORNING)
			);
			await vi.advanceTimersByTimeAsync(0);

			expect(rowIds('room-ra1')).toEqual(['old-row']);
			expect(useStore.getState().chatsRegistry['room-ra1']?.hasMoreAfter).toBeFalsy();
			expect(useStore.getState().activeConversations['room-ra1']?.scrollPositionMessageId).toBe(
				'old-row'
			);

			answer(
				buildTimelineResponse([row('room-ra1', 'target', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			await expect(jump).resolves.toBe(true);

			expect(rowIds('room-ra1')).toEqual(['target']);
			expect(useStore.getState().activeConversations['room-ra1']?.scrollPositionMessageId).toBe(
				'target'
			);
		});

		it('fails a page that does not answer in time and the queue moves on to what waited behind it', async () => {
			setUpRoom('room-rt');
			seedWindow('room-rt');
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			deferResponse();
			const hung = chatClient.requestMessagesAfter('room-rt');
			const hungOutcome = expect(hung).rejects.toMatchObject({ name: 'TimeoutError' });
			await vi.advanceTimersByTimeAsync(0);
			mockJsonResponse(
				buildTimelineResponse([row('room-rt', 'latest', AUG_FIRST_NOON) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockEmptyAfterPage();
			const reload = chatClient.returnToLatestMessages('room-rt');
			await vi.advanceTimersByTimeAsync(0);
			expect(rowIds('room-rt')).toEqual(['w1']);

			await vi.advanceTimersByTimeAsync(WINDOW_LOAD_TIMEOUT_MS);
			await hungOutcome;
			await reload;

			expect(rowIds('room-rt')).toEqual(['latest']);
			expect(useStore.getState().chatsRegistry['room-rt']?.hasMoreAfter).toBe(false);
		});

		it('gives the text back after the caller deadline while the reload goes on in the background', async () => {
			setUpRoom('room-rdl');
			seedWindow('room-rdl');
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			// A hung page ahead of the reload: 15 s of its own, then the reload's own wait
			deferResponse();
			const hung = chatClient.requestMessagesAfter('room-rdl');
			hung.catch(() => undefined);
			await vi.advanceTimersByTimeAsync(0);
			const answerLatest = deferResponse();
			const sent = chatClient.sendChatMessage('room-rdl', 'ciao');

			await vi.advanceTimersByTimeAsync(REATTACH_CALLER_DEADLINE_MS);

			await expect(sent).resolves.toBe(false);
			expect(errorSpy).toHaveBeenCalledWith(
				'chatClient.sendChatMessage: return to the latest messages failed',
				expect.objectContaining({ message: expect.stringContaining('taking too long') })
			);
			// Nothing was cancelled: the reload carries on and attaches the window
			answerLatest(
				buildTimelineResponse([row('room-rdl', 'latest', AUG_FIRST_NOON) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockEmptyAfterPage();
			await vi.advanceTimersByTimeAsync(0);
			expect(rowIds('room-rdl')).toEqual(['latest']);
			expect(useStore.getState().chatsRegistry['room-rdl']?.hasMoreAfter).toBe(false);
		});

		it('leaves the window as it was and gives the text back when the reload of a send times out', async () => {
			setUpRoom('room-rs');
			seedWindow('room-rs');
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			deferResponse();

			const sent = chatClient.sendChatMessage('room-rs', 'ciao');
			await vi.advanceTimersByTimeAsync(WINDOW_LOAD_TIMEOUT_MS);

			await expect(sent).resolves.toBe(false);
			expect(errorSpy).toHaveBeenCalledWith(
				'chatClient.sendChatMessage: return to the latest messages failed',
				expect.objectContaining({ name: 'TimeoutError' })
			);
			expect(rowIds('room-rs')).toEqual(['w1']);
			expect(useStore.getState().chatsRegistry['room-rs']?.hasMoreAfter).toBe(true);
		});

		it('leaves the window as it was when the reload fails, and the next try works', async () => {
			setUpRoom('room-rf2');
			seedWindow('room-rf2');
			(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));

			await expect(chatClient.returnToLatestMessages('room-rf2')).rejects.toThrow(BACKEND_DOWN);
			expect(rowIds('room-rf2')).toEqual(['w1']);
			expect(useStore.getState().chatsRegistry['room-rf2']?.hasMoreAfter).toBe(true);

			mockJsonResponse(
				buildTimelineResponse([row('room-rf2', 'latest', AUG_FIRST_NOON) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			mockEmptyAfterPage();
			await chatClient.returnToLatestMessages('room-rf2');
			expect(rowIds('room-rf2')).toEqual(['latest']);
		});

		it('detaches the window again from its cursor when a catch-up page times out', async () => {
			setUpRoom('room-rd4');
			seedWindow('room-rd4');
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			mockJsonResponse(
				buildTimelineResponse([row('room-rd4', 'f0', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			deferResponse();
			const next = chatClient.requestMessagesAfter('room-rd4');
			const outcome = expect(next).rejects.toMatchObject({ name: 'TimeoutError' });
			await vi.advanceTimersByTimeAsync(WINDOW_LOAD_TIMEOUT_MS);
			await outcome;

			expect(useStore.getState().chatsRegistry['room-rd4']?.hasMoreAfter).toBe(true);
			mockEmptyAfterPage();
			await chatClient.requestMessagesAfter('room-rd4');
			expect((global.fetch as Mock).mock.calls.at(-1)?.[0]).toContain('afterId=f0');
		});

		it('keeps every window load on a timeout and on the abort signal of its room', async () => {
			setUpRoom('room-rg1');
			seedWindow('room-rg1');
			deferResponse();
			const next = chatClient.requestMessagesAfter('room-rg1');
			next.catch(() => undefined);
			await vi.advanceTimersByTimeAsync(0);

			const [, init] = (global.fetch as Mock).mock.calls.at(-1) as [
				string,
				{ signal?: AbortSignal }
			];
			expect(init.signal?.aborted).toBe(false);

			useStore.getState().resetXmppData();
			expect(init.signal?.aborted).toBe(true);
			await next;
		});

		it('aborts the loads of the room that is cleared and not the ones of another room', async () => {
			setUpRoom('room-rg2');
			setUpRoom('room-rg3');
			seedWindow('room-rg2');
			seedWindow('room-rg3');
			deferResponse();
			const first = chatClient.requestMessagesAfter('room-rg2');
			deferResponse();
			const second = chatClient.requestMessagesAfter('room-rg3');
			second.catch(() => undefined);
			await vi.advanceTimersByTimeAsync(0);
			const signals = (global.fetch as Mock).mock.calls.map(
				(call) => (call[1] as { signal?: AbortSignal }).signal
			);

			useStore.getState().clearConversation('room-rg2', AUG_SECOND);
			await first;

			expect(signals[0]?.aborted).toBe(true);
			expect(signals[1]?.aborted).toBe(false);
		});

		it('does not abort a load that starts after an abort', async () => {
			setUpRoom('room-rg4');
			seedWindow('room-rg4');
			deferResponse();
			const aborted = chatClient.requestMessagesAfter('room-rg4');
			await vi.advanceTimersByTimeAsync(0);
			useStore.getState().resetXmppData();
			await aborted;

			setUpRoom('room-rg4');
			seedWindow('room-rg4');
			mockJsonResponse(
				buildTimelineResponse([row('room-rg4', 'f1', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			await chatClient.requestMessagesAfter('room-rg4');

			expect(rowIds('room-rg4')).toEqual(['w1', 'f1']);
		});

		it('keeps the results of a search that was in flight across a reconnection reset', async () => {
			setUpRoom('room-re4b');
			const answer = deferResponse();
			const search = chatClient.fullTextSearch('room-re4b', 'foo');
			await vi.advanceTimersByTimeAsync(0);

			useStore.getState().resetXmppData();
			answer({
				messages: [
					buildWireMessage({ id: 'foo-1', roomId: 'room-re4b', createdAt: AUG_FIRST_MORNING })
				],
				hasMore: false
			});
			await search;

			expect(
				useStore.getState().chatsRegistry['room-re4b']?.searchResults.map((result) => result.id)
			).toEqual(['foo-1']);
		});

		it('releases the history loader when its page answers after a reconnection reset', async () => {
			setUpRoom('room-q5');
			useStore.getState().updateHistory('room-q5', [
				createMockTextMessage({
					id: 'w1',
					stanzaId: 'w1',
					roomId: 'room-q5',
					date: Date.parse(AUG_FIRST_EARLY)
				})
			]);
			useStore.getState().setHistoryLoadDisabled('room-q5', true);
			const answer = deferResponse();
			chatClient.requestHistory('room-q5', Date.parse(AUG_FIRST_EARLY));
			await vi.advanceTimersByTimeAsync(0);

			useStore.getState().resetXmppData();
			useStore.getState().setHistoryLoadDisabled('room-q5', true);
			answer(buildTimelineResponse([], { hasMoreBefore: true }));
			await vi.advanceTimersByTimeAsync(0);

			expect(useStore.getState().activeConversations['room-q5']?.isHistoryLoadDisabled).toBe(false);
		});

		it('goes on from the last catch-up cursor, not from a live row, when the catch-up pages run out', async () => {
			setUpRoom('room-qx');
			// Known sender: its live row triggers no user request that would take a mocked page
			useStore.getState().setUserInfo([createMockUser({ id: 'u2' })]);
			seedWindow('room-qx');
			mockJsonResponse(
				buildTimelineResponse([row('room-qx', 'f0', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			const answerFirstCatchUp = deferResponse();
			Array.from({ length: 9 }, (_, index) => index + 1).forEach((index) =>
				mockJsonResponse(
					buildTimelineResponse(
						[row('room-qx', `c${index}`, `2026-08-01T10:${String(10 + index)}:00Z`) as never],
						{ hasMoreBefore: true, hasMoreAfter: true }
					)
				)
			);
			const attach = chatClient.requestMessagesAfter('room-qx');
			await vi.advanceTimersByTimeAsync(0);
			// The window is attached while the catch-up runs: a live row lands in it
			liveEvent('room-qx', 'live-x', '2026-08-01T23:00:00Z');
			answerFirstCatchUp(
				buildTimelineResponse([row('room-qx', 'c0', '2026-08-01T10:10:00Z') as never], {
					hasMoreBefore: true,
					hasMoreAfter: true
				})
			);
			await attach;
			expect(useStore.getState().chatsRegistry['room-qx']?.hasMoreAfter).toBe(true);

			mockEmptyAfterPage();
			await chatClient.requestMessagesAfter('room-qx');

			const last = (global.fetch as Mock).mock.calls.at(-1)?.[0] as string;
			expect(last).toContain('afterId=c9');
			expect(last).not.toContain('live-x');
		});

		it('detaches the window again from its cursor when a catch-up page fails', async () => {
			setUpRoom('room-qy');
			seedWindow('room-qy');
			mockJsonResponse(
				buildTimelineResponse([row('room-qy', 'f0', AUG_FIRST_MORNING) as never], {
					hasMoreBefore: true,
					hasMoreAfter: false
				})
			);
			(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error(BACKEND_DOWN)));

			await expect(chatClient.requestMessagesAfter('room-qy')).rejects.toThrow(BACKEND_DOWN);

			expect(useStore.getState().chatsRegistry['room-qy']?.hasMoreAfter).toBe(true);
			mockEmptyAfterPage();
			await chatClient.requestMessagesAfter('room-qy');
			expect((global.fetch as Mock).mock.calls.at(-1)?.[0]).toContain('afterId=f0');
			expect(useStore.getState().chatsRegistry['room-qy']?.hasMoreAfter).toBe(false);
		});

		describe('stale unread count of a detached window', () => {
			const seedStaleRoom = (id: string): void => {
				setUpRoom(id);
				useStore.getState().updateHistory(id, [
					createMockTextMessage({
						id: `w-${id}`,
						stanzaId: `w-${id}`,
						roomId: id,
						from: 'u2',
						date: Date.parse(AUG_FIRST_EARLY)
					})
				]);
				useStore.getState().setUnreadCount(id, 10);
				useStore.getState().setHasMoreAfter(id, true);
			};
			const read = (roomId: string, userId: string): void =>
				wsChatEventsRouter(
					buildWsReadUpdatedEvent({ roomId, userId, itemCreatedAt: AUG_FIRST_LATE_MORNING })
				);
			const staleOf = (roomId: string): number | undefined =>
				useStore.getState().chatsRegistry[roomId]?.unreadStale;

			it('refreshes once at a time, only on an own read, and keeps the flag after a failed refresh', async () => {
				seedStaleRoom('room-ru');
				vi.spyOn(console, 'error').mockImplementation(() => undefined);
				let failInbox: () => void = () => undefined;
				const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockImplementationOnce(
					() =>
						new Promise<void>((_, reject) => {
							failInbox = (): void => reject(new Error(BACKEND_DOWN));
						})
				);

				read('room-ru', 'u2');
				expect(inboxSpy).not.toHaveBeenCalled();

				read('room-ru', 'me');
				expect(staleOf('room-ru')).toBeGreaterThan(0);
				read('room-ru', 'me');
				read('room-ru', 'me');
				expect(inboxSpy).toHaveBeenCalledTimes(1);

				failInbox();
				await vi.advanceTimersByTimeAsync(0);
				expect(staleOf('room-ru')).toBeGreaterThan(0);
				inboxSpy.mockResolvedValueOnce(undefined);
				read('room-ru', 'me');
				await vi.advanceTimersByTimeAsync(0);
				expect(inboxSpy).toHaveBeenCalledTimes(2);
				expect(staleOf('room-ru')).toBeUndefined();
			});

			it('releases a room only with a refresh issued after it went stale and runs again for the one that went stale meanwhile', async () => {
				seedStaleRoom('room-ra2');
				seedStaleRoom('room-rb2');
				let answerFirst: () => void = () => undefined;
				const inboxSpy = vi.spyOn(wscSdk, 'fetchInbox').mockImplementationOnce(
					() =>
						new Promise<void>((resolve) => {
							answerFirst = resolve;
						})
				);
				read('room-ra2', 'me');
				expect(inboxSpy).toHaveBeenCalledTimes(1);
				const issuedForA = staleOf('room-ra2');

				// Room B goes stale while the refresh issued for A is in flight
				inboxSpy.mockResolvedValueOnce(undefined);
				read('room-rb2', 'me');
				expect(inboxSpy).toHaveBeenCalledTimes(1);
				answerFirst();
				await vi.advanceTimersByTimeAsync(0);

				expect(issuedForA).toBeGreaterThan(0);
				expect(inboxSpy).toHaveBeenCalledTimes(2);
				expect(staleOf('room-ra2')).toBeUndefined();
				expect(staleOf('room-rb2')).toBeUndefined();
			});
		});
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
