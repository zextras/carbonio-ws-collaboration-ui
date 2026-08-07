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

const AUG_FIRST_LATE_MORNING = '2026-08-01T10:00:00Z';

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
