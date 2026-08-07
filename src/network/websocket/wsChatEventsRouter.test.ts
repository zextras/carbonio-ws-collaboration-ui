/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { wsChatEventsRouter } from './wsChatEventsRouter';
import useStore from '../../store/Store';
import { createMockTextMessage } from '../../tests/createMock';
import type { WsPresenceChangedEvent } from '../../types/network/websocket/wsChatEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';

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
				date: Date.parse('2026-08-01T10:00:00Z')
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
				date: Date.parse('2026-08-01T10:00:00Z')
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
