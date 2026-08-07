/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { wsChatEventsRouter } from './wsChatEventsRouter';
import { EventName } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { createMockTextMessage } from '../../tests/createMock';
import type { WsPresenceChangedEvent } from '../../types/network/websocket/wsChatEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';

const AUG_FIRST_LATE_MORNING = '2026-08-01T10:00:00Z';
const replyText = 'ti rispondo';

function presenceEvent(userId: string, online: boolean): WsPresenceChangedEvent {
	return { type: WsEventType.PRESENCE_CHANGED, userId, online };
}

function mockJsonResponseOnce(body: unknown): void {
	(global.fetch as Mock).mockImplementationOnce(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			headers: {
				get: (name: string): string | null =>
					name.toLowerCase() === 'content-type' ? 'application/json' : null
			},
			json: (): Promise<unknown> => Promise.resolve(body)
		})
	);
}

describe('wsChatEventsRouter - PresenceChanged', () => {
	it('lands an online transition in the store without any round-trip', async () => {
		wsChatEventsRouter(presenceEvent('user-online', true));
		await vi.advanceTimersByTimeAsync(0);

		expect(useStore.getState().users['user-online']).toMatchObject({ online: true });
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('refreshes the last activity through the presence batch on an offline transition', async () => {
		mockJsonResponseOnce([
			{ userId: 'user-off', online: false, lastActivity: '2026-08-01T09:00:00Z' }
		]);

		wsChatEventsRouter(presenceEvent('user-off', false));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/presence/batch');
		expect(useStore.getState().users['user-off']).toMatchObject({
			online: false,
			lastActivity: Date.parse('2026-08-01T09:00:00Z')
		});
	});

	it('ignores the logged user own echo (v1 parity: it never reached the store)', async () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter(presenceEvent('me', false));
		await vi.advanceTimersByTimeAsync(0);

		expect(useStore.getState().users.me).toBeUndefined();
		expect(global.fetch).not.toHaveBeenCalled();
	});
});

describe('wsChatEventsRouter - ReadUpdated', () => {
	it('stores another member read marker without any round-trip', () => {
		useStore.getState().updateHistory('room-r', [
			createMockTextMessage({
				id: 'msg-r1',
				roomId: 'room-r',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);

		wsChatEventsRouter({
			type: WsEventType.READ_UPDATED,
			roomId: 'room-r',
			userId: 'user-2',
			messageId: 'msg-r1'
		});

		expect(useStore.getState().chatsRegistry['room-r']?.markers['user-2']).toMatchObject({
			messageId: 'msg-r1',
			type: 'displayed'
		});
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('clears the unread counter when the own echo comes back (v1 displayed-echo parity)', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-u', [
			createMockTextMessage({
				id: 'msg-u1',
				roomId: 'room-u',
				from: 'user-2',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		useStore.getState().setUnreadCount('room-u', 1);

		wsChatEventsRouter({
			type: WsEventType.READ_UPDATED,
			roomId: 'room-u',
			userId: 'me',
			messageId: 'msg-u1'
		});

		expect(useStore.getState().chatsRegistry['room-u']?.unread).toBe(0);
	});
});

describe('wsChatEventsRouter - MessageReceived', () => {
	it("appends another sender's message, bumps the unread counter and fires the NEW_MESSAGE event", () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const received: Array<unknown> = [];
		const listener = (event: Event): void => {
			received.push((event as CustomEvent).detail);
		};
		window.addEventListener(EventName.NEW_MESSAGE, listener);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-in-1',
			roomId: 'room-in',
			senderId: 'user-2',
			text: 'ciao a tutti',
			timestamp: AUG_FIRST_LATE_MORNING
		});
		window.removeEventListener(EventName.NEW_MESSAGE, listener);

		const registry = useStore.getState().chatsRegistry['room-in'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-in-1']);
		expect(registry?.lastMessage).toMatchObject({ id: 'msg-in-1', text: 'ciao a tutti' });
		expect(registry?.unread).toBe(1);
		expect(received).toEqual([expect.objectContaining({ id: 'msg-in-1' })]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('never bumps the unread counter for an own message from another session', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-other-device',
			roomId: 'room-md',
			senderId: 'me',
			text: 'dal telefono',
			timestamp: AUG_FIRST_LATE_MORNING
		});

		const registry = useStore.getState().chatsRegistry['room-md'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-other-device']);
		expect(registry?.unread ?? 0).toBe(0);
	});

	it('hydrates the reply section from the store when a reply lands (v1 hydration parity)', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-rr', [
			createMockTextMessage({
				id: 'msg-orig',
				roomId: 'room-rr',
				from: 'user-2',
				text: 'messaggio originale',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-reply-1',
			roomId: 'room-rr',
			senderId: 'user-3',
			text: replyText,
			timestamp: AUG_FIRST_LATE_MORNING,
			replyToId: 'msg-orig'
		});

		const reply = useStore
			.getState()
			.chatsRegistry['room-rr']?.messages.find((message) => message.id === 'msg-reply-1');
		expect(reply).toMatchObject({
			replyTo: 'msg-orig',
			repliedMessage: expect.objectContaining({ id: 'msg-orig', text: 'messaggio originale' })
		});
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('keeps a reply renderable when the quoted message is not loaded', () => {
		// v1 fired an archive query by id here; v2 has no such endpoint, so the
		// bubble renders without the reply section (and without any round-trip)
		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-reply-2',
			roomId: 'room-rn',
			senderId: 'user-3',
			text: 'reply orfana',
			timestamp: AUG_FIRST_LATE_MORNING,
			replyToId: 'msg-ancient'
		});

		const message = useStore.getState().chatsRegistry['room-rn']?.messages[0];
		expect(message).toMatchObject({ id: 'msg-reply-2', replyTo: 'msg-ancient' });
		expect((message as TextMessage).repliedMessage).toBeUndefined();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('promotes a reply placeholder from the self-echo with the reply section hydrated', () => {
		const targetId = 'msg-target';
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-re', [
			createMockTextMessage({
				id: targetId,
				stanzaId: targetId,
				roomId: 'room-re',
				from: 'user-2',
				text: 'messaggio citato',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		useStore.getState().setPlaceholderMessage({
			roomId: 'room-re',
			id: 'tmp-re',
			text: replyText,
			replyTo: targetId
		});

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-reply-echo',
			roomId: 'room-re',
			senderId: 'me',
			text: replyText,
			timestamp: AUG_FIRST_LATE_MORNING,
			replyToId: targetId,
			tempId: 'tmp-re'
		});

		const { messages } = useStore.getState().chatsRegistry['room-re'];
		// The PENDING placeholder is gone: one confirmed reply, quoted message attached
		expect(messages.map((message) => message.id)).toEqual([targetId, 'msg-reply-echo']);
		expect(messages[1]).toMatchObject({
			from: 'me',
			read: 'unread',
			replyTo: targetId,
			repliedMessage: expect.objectContaining({ id: targetId, text: 'messaggio citato' })
		});
		expect(useStore.getState().chatsRegistry['room-re']?.unread ?? 0).toBe(0);
	});

	it('promotes the own placeholder from the self-echo without touching the unread counter', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore
			.getState()
			.setPlaceholderMessage({ roomId: 'room-echo', id: 'tmp-1', text: 'in volo' });

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-server-1',
			roomId: 'room-echo',
			senderId: 'me',
			text: 'in volo',
			timestamp: AUG_FIRST_LATE_MORNING,
			tempId: 'tmp-1'
		});

		const registry = useStore.getState().chatsRegistry['room-echo'];
		// The PENDING placeholder is gone: one confirmed message with the server id
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-server-1']);
		expect(registry?.messages[0]).toMatchObject({ from: 'me', read: 'unread' });
		expect(registry?.unread ?? 0).toBe(0);
	});
});
