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
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { wsClient } from '../websocket/WebSocketClient';
import { wsChatEventsRouter } from '../websocket/wsChatEventsRouter';
import { xmppClient } from '../xmpp/XMPPClient';

const AUG_FIRST_MORNING = '2026-08-01T09:00:00Z';
const PIN_FEATURE = 'zextras:iq:pin';
const AUG_FIRST_LATE_MORNING = '2026-08-01T10:00:00Z';
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
				lastMessage: buildWireMessage({
					id: 'msg-1',
					roomId: 'room-1',
					senderId: 'user-2',
					text: 'ciao',
					createdAt: AUG_FIRST_LATE_MORNING
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
						createdAt: AUG_FIRST_LATE_MORNING
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
			body: JSON.stringify({ messageId: 'msg-m1' })
		});
	});

	it('does not PUT a read marker for a message missing from the store (v1 parity)', () => {
		useStore.getState().setApiVersion('2.0.0');

		chatClient.readMessage('room-m', 'msg-ghost');

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('sends a message through the SDK: optimistic placeholder, then the REST confirmation promotes it', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const sentId = 'msg-sent-1';
		mockJsonResponse({ id: sentId, createdAt: AUG_FIRST_LATE_MORNING });

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
								Promise.resolve({ id: 'msg-dup', createdAt: AUG_FIRST_LATE_MORNING })
						});
				})
		);

		chatClient.sendChatMessage('room-d', 'doppio');
		const tempId = useStore.getState().chatsRegistry['room-d'].messages[0].id;
		await vi.advanceTimersByTimeAsync(0);

		// The WS self-echo arrives while the REST call is still in flight
		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-dup',
			roomId: 'room-d',
			senderId: 'me',
			text: 'doppio',
			timestamp: AUG_FIRST_LATE_MORNING,
			tempId
		});
		expect(
			useStore.getState().chatsRegistry['room-d'].messages.map((message) => message.id)
		).toEqual(['msg-dup']);

		// The late REST confirmation must be a no-op, not a duplicate
		releaseRest();
		await vi.advanceTimersByTimeAsync(0);

		const { messages } = useStore.getState().chatsRegistry['room-d'];
		expect(messages.map((message) => message.id)).toEqual(['msg-dup']);
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
		mockJsonResponse({ id: 'msg-new', createdAt: AUG_FIRST_LATE_MORNING });

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
		mockJsonResponse({ id: 'msg-reply', createdAt: AUG_FIRST_LATE_MORNING });

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
		mockJsonResponse({ id: editTargetId, text: editedText, updatedAt: AUG_FIRST_LATE_MORNING });

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
		wsChatEventsRouter({
			type: WsEventType.MESSAGE_EDITED,
			messageId: editTargetId,
			roomId: 'room-ed',
			senderId: 'me',
			text: editedText,
			editedAt: AUG_FIRST_LATE_MORNING
		});
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

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_DELETED,
			messageId: 'msg-del',
			roomId: 'room-del',
			senderId: 'me',
			deletedAt: AUG_FIRST_LATE_MORNING
		});
		expect(useStore.getState().chatsRegistry['room-del'].fastenings['msg-del']).toEqual([
			expect.objectContaining({ action: 'delete', originalStanzaId: 'msg-del' })
		]);
		expect(useStore.getState().chatsRegistry['room-del'].lastMessage).toMatchObject({
			deleted: true,
			text: ''
		});
	});

	it('reacts to a message through the SDK: POST with the percent-encoded emoji', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockJsonResponse(undefined);

		chatClient.sendChatMessageReaction('room-rx', 'msg-rx', '👨‍👩‍👧');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe(
			`/services/chats/rooms/room-rx/messages/msg-rx/reactions/${encodeURIComponent('👨‍👩‍👧')}`
		);
		expect(calls[0]?.[1]).toMatchObject({ method: 'POST' });
	});

	it('removes a reaction by resolving my current emoji from the store (v1 empty-value contract)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		// My active reaction lands from its own echo, the only confirmation path
		wsChatEventsRouter({
			type: WsEventType.REACTION_CHANGED,
			messageId: 'msg-rm',
			roomId: 'room-rm',
			userId: 'me',
			reaction: '👍',
			operation: 'added'
		});
		mockJsonResponse(undefined);

		chatClient.sendChatMessageReaction('room-rm', 'msg-rm', '');
		await vi.advanceTimersByTimeAsync(0);

		const { calls } = (global.fetch as Mock).mock;
		expect(calls).toHaveLength(1);
		expect(calls[0]?.[0]).toBe(
			`/services/chats/rooms/room-rm/messages/msg-rm/reactions/${encodeURIComponent('👍')}`
		);
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
			{
				messageId: 'msg-gp',
				roomId: 'room-gp',
				pinnedBy: 'user-2',
				pinnedAt: AUG_FIRST_LATE_MORNING,
				text: 'dal DTO',
				senderId: 'user-9'
			}
		]);

		chatClient.getMessagePin('room-gp');
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-gp/pin');
		expect(useStore.getState().activeConversations['room-gp']?.messagePinned).toMatchObject({
			id: 'msg-gp',
			text: 'dal mio store'
		});
	});

	it('degrades the banner to the DTO stub when the pin target is off-window', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockJsonResponse([
			{
				messageId: 'msg-off',
				roomId: 'room-goff',
				pinnedBy: 'user-2',
				pinnedAt: AUG_FIRST_LATE_MORNING,
				text: 'testo remoto',
				senderId: 'user-9'
			}
		]);

		chatClient.getMessagePin('room-goff');
		await vi.advanceTimersByTimeAsync(0);

		expect(useStore.getState().activeConversations['room-goff']?.messagePinned).toMatchObject({
			id: 'msg-off',
			text: 'testo remoto',
			from: 'user-9',
			date: Date.parse(AUG_FIRST_LATE_MORNING)
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

	it('searches through the SDK with the cleared-history bound, one shot like v1', async () => {
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
					createdAt: '2026-08-01T11:00:00Z'
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

	it('walks backward pages until the jump target enters the store (contiguous history)', async () => {
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
		// First page: still no target; second page: the target lands
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-middle',
							roomId: jumpRoomId,
							createdAt: AUG_FIRST_LATE_MORNING
						})
					)
				],
				{ hasMoreBefore: true }
			)
		);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: jumpTargetId,
							roomId: jumpRoomId,
							createdAt: '2026-08-01T09:30:00Z'
						})
					)
				],
				{ hasMoreBefore: true }
			)
		);

		await expect(
			chatClient.requestMessageResultHistoryToId(jumpRoomId, jumpTargetId)
		).resolves.toBeUndefined();

		const calls = (global.fetch as Mock).mock.calls.map((call) => call[0] as string);
		expect(calls).toHaveLength(2);
		// Composite cursor anchored to the oldest loaded message, page by page
		expect(calls[0]).toContain('/rooms/room-j/timeline?');
		expect(calls[0]).toContain('beforeId=msg-recent');
		expect(calls[1]).toContain('beforeId=msg-middle');
		expect(
			useStore.getState().chatsRegistry[jumpRoomId]?.messages.map((message) => message.id)
		).toEqual([jumpTargetId, 'msg-middle', jumpRecentId]);
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

	it('stops the jump on a fully loaded history when the target does not exist', async () => {
		useStore.getState().setApiVersion('2.0.0');
		useStore.getState().addRooms([createMockRoom({ id: 'room-jf', createdAt: AUG_FIRST_MORNING })]);
		mockJsonResponse(
			buildTimelineResponse(
				[
					buildMessageTimelineItem(
						buildWireMessage({
							id: 'msg-only',
							roomId: 'room-jf',
							createdAt: AUG_FIRST_LATE_MORNING
						})
					)
				],
				{ hasMoreBefore: false }
			)
		);

		await expect(
			chatClient.requestMessageResultHistoryToId('room-jf', 'msg-ghost')
		).resolves.toBeUndefined();

		expect((global.fetch as Mock).mock.calls).toHaveLength(1);
		expect(useStore.getState().activeConversations['room-jf']?.isHistoryFullyLoaded).toBeTruthy();
	});

	it('breaks the jump walk when a page moves nothing (defensive stall guard)', async () => {
		useStore.getState().setApiVersion('2.0.0');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		useStore.getState().addRooms([createMockRoom({ id: 'room-js', createdAt: AUG_FIRST_MORNING })]);
		useStore.getState().updateHistory('room-js', [
			createMockTextMessage({
				id: 'msg-top',
				stanzaId: 'msg-top',
				roomId: 'room-js',
				date: Date.parse('2026-08-01T12:00:00Z')
			})
		]);
		const redundantPage = (): void =>
			mockJsonResponse(
				buildTimelineResponse(
					[
						buildMessageTimelineItem(
							buildWireMessage({
								id: 'msg-stuck',
								roomId: 'room-js',
								createdAt: AUG_FIRST_LATE_MORNING
							})
						)
					],
					{ hasMoreBefore: true }
				)
			);
		// A buggy backend repeating the same page forever must not spin the walk
		redundantPage();
		redundantPage();

		await expect(
			chatClient.requestMessageResultHistoryToId('room-js', 'msg-ghost')
		).resolves.toBeUndefined();

		expect((global.fetch as Mock).mock.calls).toHaveLength(2);
		expect(warnSpy).toHaveBeenCalledWith(
			'chatClient.requestMessageResultHistoryToId: pagination stalled',
			'room-js'
		);
	});
});
