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
const AUG_FIRST_EARLY_MORNING = '2026-08-01T09:00:00Z';
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
			{ userId: 'user-off', online: false, lastActivity: AUG_FIRST_EARLY_MORNING }
		]);

		wsChatEventsRouter(presenceEvent('user-off', false));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/presence/batch');
		expect(useStore.getState().users['user-off']).toMatchObject({
			online: false,
			lastActivity: Date.parse(AUG_FIRST_EARLY_MORNING)
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

describe('wsChatEventsRouter - MessageEdited', () => {
	const editedText = 'testo corretto';
	const originalText = 'testo originale';

	function editedEvent(
		roomId: string,
		messageId: string
	): Parameters<typeof wsChatEventsRouter>[0] {
		return {
			type: WsEventType.MESSAGE_EDITED,
			messageId,
			roomId,
			senderId: 'user-2',
			text: editedText,
			editedAt: '2026-08-01T11:00:00Z'
		};
	}

	it('files the EDIT fastening and rebuilds the sidebar entry when it targets the last message', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const target = createMockTextMessage({
			id: 'msg-last',
			stanzaId: 'msg-last',
			roomId: 'room-ed',
			from: 'user-2',
			text: originalText,
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
		useStore.getState().updateHistory('room-ed', [target]);
		useStore.getState().setLastMessage('room-ed', target);

		wsChatEventsRouter(editedEvent('room-ed', 'msg-last'));

		const registry = useStore.getState().chatsRegistry['room-ed'];
		// The message keeps the original text: the bubble projects the fastening
		expect(registry?.messages[0]).toMatchObject({ text: originalText });
		expect(registry?.fastenings['msg-last']).toEqual([
			expect.objectContaining({ action: 'edit', value: editedText, from: 'user-2' })
		]);
		// v1 fastening handler parity: sidebar rebuilt, no unread bump, no round-trip
		expect(registry?.lastMessage).toMatchObject({ edited: true, text: editedText });
		expect(registry?.unread ?? 0).toBe(0);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('leaves the sidebar untouched when the edit targets an older message', () => {
		const older = createMockTextMessage({
			id: 'msg-old',
			stanzaId: 'msg-old',
			roomId: 'room-eo',
			text: 'vecchio',
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
		const last = createMockTextMessage({
			id: 'msg-new',
			stanzaId: 'msg-new',
			roomId: 'room-eo',
			text: 'ultimo',
			date: Date.parse('2026-08-01T10:30:00Z')
		});
		useStore.getState().updateHistory('room-eo', [older, last]);
		useStore.getState().setLastMessage('room-eo', last);

		wsChatEventsRouter(editedEvent('room-eo', 'msg-old'));

		const registry = useStore.getState().chatsRegistry['room-eo'];
		expect(registry?.fastenings['msg-old']).toHaveLength(1);
		expect(registry?.lastMessage).toMatchObject({ id: 'msg-new', text: 'ultimo' });
	});

	it('keeps one fastening when the echo repeats the REST confirmation (deterministic id)', () => {
		const target = createMockTextMessage({
			id: 'msg-twice',
			stanzaId: 'msg-twice',
			roomId: 'room-ei',
			text: originalText,
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
		useStore.getState().updateHistory('room-ei', [target]);

		// Same edit landing from both confirmation paths builds the same
		// fastening id: the slice dedup makes the second write a no-op
		wsChatEventsRouter(editedEvent('room-ei', 'msg-twice'));
		wsChatEventsRouter(editedEvent('room-ei', 'msg-twice'));

		expect(useStore.getState().chatsRegistry['room-ei']?.fastenings['msg-twice']).toHaveLength(1);
	});
});

describe('wsChatEventsRouter - MessageDeleted', () => {
	function deletedEvent(
		roomId: string,
		messageId: string
	): Parameters<typeof wsChatEventsRouter>[0] {
		return {
			type: WsEventType.MESSAGE_DELETED,
			messageId,
			roomId,
			senderId: 'user-2',
			deletedAt: '2026-08-01T12:00:00Z'
		};
	}

	it('files the DELETE fastening and clears the sidebar entry when it targets the last message', () => {
		const target = createMockTextMessage({
			id: 'msg-last',
			stanzaId: 'msg-last',
			roomId: 'room-dl',
			from: 'user-2',
			text: 'da cancellare',
			date: Date.parse(AUG_FIRST_LATE_MORNING),
			replyTo: 'msg-quoted',
			attachment: { id: 'att-1', name: 'foto.png', mimeType: 'image/png', size: 10 }
		});
		useStore.getState().updateHistory('room-dl', [target]);
		useStore.getState().setLastMessage('room-dl', target);

		wsChatEventsRouter(deletedEvent('room-dl', 'msg-last'));

		const registry = useStore.getState().chatsRegistry['room-dl'];
		// The message itself keeps its text: the bubble projects the fastening
		expect(registry?.messages[0]).toMatchObject({ text: 'da cancellare' });
		expect(registry?.fastenings['msg-last']).toEqual([
			expect.objectContaining({ action: 'delete', from: 'user-2' })
		]);
		// v1 fastening handler parity: sidebar rebuilt with text, attachment and
		// reply reference cleared; no unread bump, no round-trip
		expect(registry?.lastMessage).toMatchObject({ deleted: true, text: '' });
		expect((registry?.lastMessage as TextMessage).attachment).toBeUndefined();
		expect((registry?.lastMessage as TextMessage).replyTo).toBeUndefined();
		expect(registry?.unread ?? 0).toBe(0);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('leaves the sidebar untouched when the deletion targets an older message', () => {
		const older = createMockTextMessage({
			id: 'msg-old',
			stanzaId: 'msg-old',
			roomId: 'room-do',
			text: 'vecchio',
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
		const last = createMockTextMessage({
			id: 'msg-new',
			stanzaId: 'msg-new',
			roomId: 'room-do',
			text: 'ultimo',
			date: Date.parse('2026-08-01T10:30:00Z')
		});
		useStore.getState().updateHistory('room-do', [older, last]);
		useStore.getState().setLastMessage('room-do', last);

		wsChatEventsRouter(deletedEvent('room-do', 'msg-old'));

		const registry = useStore.getState().chatsRegistry['room-do'];
		expect(registry?.fastenings['msg-old']).toHaveLength(1);
		expect(registry?.lastMessage).toMatchObject({ id: 'msg-new', text: 'ultimo' });
	});

	it('keeps the DELETE last in the projection order when it lands after an edit', () => {
		const target = createMockTextMessage({
			id: 'msg-ed',
			stanzaId: 'msg-ed',
			roomId: 'room-dp',
			text: 'originale',
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
		useStore.getState().updateHistory('room-dp', [target]);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_EDITED,
			messageId: 'msg-ed',
			roomId: 'room-dp',
			senderId: 'user-2',
			text: 'corretto',
			editedAt: '2026-08-01T11:00:00Z'
		});
		wsChatEventsRouter(deletedEvent('room-dp', 'msg-ed'));

		// The slice orders by date and the projection (useMessage) takes the
		// last EDIT/DELETE: the server-stamped deletion wins over the edit
		const fastenings = useStore.getState().chatsRegistry['room-dp']?.fastenings['msg-ed'];
		expect(fastenings?.map((fastening) => fastening.action)).toEqual(['edit', 'delete']);
	});
});

describe('wsChatEventsRouter - ReactionChanged', () => {
	function reactionEvent(
		userId: string,
		operation: 'added' | 'removed'
	): Parameters<typeof wsChatEventsRouter>[0] {
		return {
			type: WsEventType.REACTION_CHANGED,
			messageId: 'msg-mine',
			roomId: 'room-rc',
			userId,
			reaction: '👍',
			operation
		};
	}

	function seedMyMessage(): void {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-rc', [
			createMockTextMessage({
				id: 'msg-mine',
				stanzaId: 'msg-mine',
				roomId: 'room-rc',
				from: 'me',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
	}

	it("files another user's reaction and triggers the v1 animation state, without unread bumps", () => {
		seedMyMessage();

		wsChatEventsRouter(reactionEvent('user-2', 'added'));

		const registry = useStore.getState().chatsRegistry['room-rc'];
		expect(registry?.fastenings['msg-mine']).toEqual([
			expect.objectContaining({ action: 'reaction', from: 'user-2', value: '👍' })
		]);
		// v1 parity: newReactions animation state (slice self-guards on my own
		// messages), no unread, no round-trip
		expect(useStore.getState().activeConversations['room-rc']?.newReactions).toEqual([
			{ stanzaId: 'msg-mine', reaction: '👍' }
		]);
		expect(registry?.unread ?? 0).toBe(0);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('files my own echo without touching the animation state', () => {
		seedMyMessage();

		wsChatEventsRouter(reactionEvent('me', 'added'));

		expect(useStore.getState().chatsRegistry['room-rc']?.fastenings['msg-mine']).toHaveLength(1);
		expect(useStore.getState().activeConversations['room-rc']?.newReactions).toBeUndefined();
	});

	it('keeps the whole toggle history with increasing dates (add -> remove -> add)', () => {
		seedMyMessage();

		wsChatEventsRouter(reactionEvent('user-2', 'added'));
		wsChatEventsRouter(reactionEvent('user-2', 'removed'));
		wsChatEventsRouter(reactionEvent('user-2', 'added'));

		const fastenings = useStore.getState().chatsRegistry['room-rc']?.fastenings['msg-mine'];
		// Three distinct fastenings, v1 stanza-history parity: the projection
		// (latest per user by date) must land on the re-added emoji
		expect(fastenings?.map((fastening) => fastening.value)).toEqual(['👍', '', '👍']);
		expect(fastenings?.[2]?.date).toBeGreaterThan(fastenings?.[1]?.date as number);
		expect(fastenings?.[1]?.date).toBeGreaterThan(fastenings?.[0]?.date as number);
	});
});

describe('wsChatEventsRouter - MessageForwarded', () => {
	const forwardedText = 'contenuto inoltrato';

	function forwardedEvent(senderId: string): Parameters<typeof wsChatEventsRouter>[0] {
		return {
			type: WsEventType.MESSAGE_FORWARDED,
			messageId: 'msg-fw',
			roomId: 'room-fw',
			originalRoomId: 'room-src',
			senderId,
			text: forwardedText,
			timestamp: AUG_FIRST_LATE_MORNING,
			forwardedFrom: 'user-9',
			forwardedAt: AUG_FIRST_EARLY_MORNING
		};
	}

	it("lands another user's forward as a new message with the forwarded badge and the v1 effects", () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const received: Array<unknown> = [];
		const listener = (event: Event): void => {
			received.push((event as CustomEvent).detail);
		};
		window.addEventListener(EventName.NEW_MESSAGE, listener);

		wsChatEventsRouter(forwardedEvent('user-2'));
		window.removeEventListener(EventName.NEW_MESSAGE, listener);

		const registry = useStore.getState().chatsRegistry['room-fw'];
		expect(registry?.messages[0]).toMatchObject({
			id: 'msg-fw',
			text: forwardedText,
			forwarded: { from: 'user-9', date: Date.parse(AUG_FIRST_EARLY_MORNING), count: 1 }
		});
		expect(registry?.lastMessage).toMatchObject({ id: 'msg-fw' });
		expect(registry?.unread).toBe(1);
		expect(received).toEqual([expect.objectContaining({ id: 'msg-fw' })]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('lands my own forward echo without touching the unread counter', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter(forwardedEvent('me'));

		const registry = useStore.getState().chatsRegistry['room-fw'];
		expect(registry?.messages[0]).toMatchObject({ id: 'msg-fw', from: 'me' });
		expect(registry?.unread ?? 0).toBe(0);
	});

	it('keeps the forwarded badge when a forward is delivered as MessageReceived (dual-path)', () => {
		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-fw-dual',
			roomId: 'room-fd',
			senderId: 'user-2',
			text: forwardedText,
			timestamp: AUG_FIRST_LATE_MORNING,
			forwardedFrom: 'user-9',
			forwardedAt: AUG_FIRST_EARLY_MORNING
		});

		expect(useStore.getState().chatsRegistry['room-fd']?.messages[0]).toMatchObject({
			forwarded: expect.objectContaining({ from: 'user-9' })
		});
	});
});
