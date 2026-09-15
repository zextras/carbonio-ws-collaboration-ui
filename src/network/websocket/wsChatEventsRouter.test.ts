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
import { createMockMessageFastening, createMockTextMessage } from '../../tests/createMock';
import type {
	WsMessagePinnedEvent,
	WsPresenceChangedEvent
} from '../../types/network/websocket/wsChatEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { FasteningAction, MessageType, OperationType } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';

const AUG_FIRST_LATE_MORNING = '2026-08-01T10:00:00Z';
const AUG_FIRST_EARLY_MORNING = '2026-08-01T09:00:00Z';
const replyText = 'ti rispondo';
const photoName = 'photo.png';
const pngMime = 'image/png';
const cloneFileId = 'file-clone';

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

	it('logs and survives a failing last-activity refresh on an offline transition', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		(global.fetch as Mock).mockImplementationOnce(() => Promise.reject(new Error('network down')));

		wsChatEventsRouter(presenceEvent('user-fail', false));
		await vi.advanceTimersByTimeAsync(0);

		expect(errorSpy).toHaveBeenCalledWith(
			'wsChatEventsRouter: presence hydration failed',
			expect.any(Error)
		);
		// The offline flag from the event landed anyway: only the refresh failed
		expect(useStore.getState().users['user-fail']).toMatchObject({ online: false });
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

describe('wsChatEventsRouter - MessageReceived attachments', () => {
	const galleryFilter = { sortBy: 'created_at', order: 'desc' } as const;
	const wireAttachment = { id: 'file-1', name: photoName, mimeType: pngMime, size: 2048 };

	function initGallery(roomId: string): void {
		// The v1 prepend only lands on initialized buckets (gallery opened once)
		useStore.getState().appendMediaGalleryPage(roomId, galleryFilter, [], 0, undefined);
	}

	function galleryIds(roomId: string): Array<string> {
		const state = useStore.getState().mediaGallery[roomId];
		return Object.values(state?.buckets ?? {}).flatMap((bucket) =>
			bucket.attachments.map((attachment) => attachment.id)
		);
	}

	it("lands another sender's attachment message in the store and prepends it to the gallery", () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		initGallery('room-att');

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-att-1',
			roomId: 'room-att',
			senderId: 'user-2',
			text: 'a caption',
			timestamp: AUG_FIRST_LATE_MORNING,
			attachments: [wireAttachment]
		});

		const registry = useStore.getState().chatsRegistry['room-att'];
		expect(registry?.messages[0]).toMatchObject({ id: 'msg-att-1', attachment: wireAttachment });
		expect(registry?.unread).toBe(1);
		// v1 gallery parity: userId/createdAt/messageId come from the parent message
		const state = useStore.getState().mediaGallery['room-att'];
		expect(Object.values(state?.buckets ?? {})[0]?.attachments[0]).toMatchObject({
			id: 'file-1',
			userId: 'user-2',
			messageId: 'msg-att-1'
		});
	});

	it('accepts the flat fallback shape of the REST Message schema', () => {
		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-att-flat',
			roomId: 'room-att-flat',
			senderId: 'user-2',
			text: '',
			timestamp: AUG_FIRST_LATE_MORNING,
			attachmentId: 'file-flat',
			attachmentName: 'doc.pdf',
			attachmentMime: 'application/pdf',
			attachmentSize: 99
		});

		expect(useStore.getState().chatsRegistry['room-att-flat']?.messages[0]).toMatchObject({
			attachment: { id: 'file-flat', name: 'doc.pdf', mimeType: 'application/pdf', size: 99 }
		});
	});

	it('promotes the upload placeholder from the self-echo, gallery included, unread untouched', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		initGallery('room-up');
		useStore.getState().setPlaceholderMessage({
			roomId: 'room-up',
			id: 'tmp-up',
			text: 'a caption',
			attachment: { id: 'placeholderFileId', name: photoName, mimeType: pngMime, size: 2048 }
		});

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-up-1',
			roomId: 'room-up',
			senderId: 'me',
			text: 'a caption',
			timestamp: AUG_FIRST_LATE_MORNING,
			tempId: 'tmp-up',
			attachments: [wireAttachment]
		});

		const registry = useStore.getState().chatsRegistry['room-up'];
		// The echo metadata wins: real file id, not the placeholder stub
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-up-1']);
		expect(registry?.messages[0]).toMatchObject({ attachment: wireAttachment });
		expect(registry?.unread ?? 0).toBe(0);
		expect(galleryIds('room-up')).toEqual(['file-1']);
	});

	it('keeps the placeholder attachment when the self-echo carries no metadata', () => {
		// The upload 201 answers with the file id, not the message: the echo is
		// the only confirmation. Without metadata the bubble must keep rendering
		// the uploaded file (name/mime/size for the icon; the id heals on refetch)
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		initGallery('room-nf');
		useStore.getState().setPlaceholderMessage({
			roomId: 'room-nf',
			id: 'tmp-nf',
			text: '',
			attachment: {
				id: 'placeholderFileId',
				name: photoName,
				mimeType: pngMime,
				size: 2048,
				area: '640x480'
			}
		});

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_RECEIVED,
			messageId: 'msg-nf-1',
			roomId: 'room-nf',
			senderId: 'me',
			text: '',
			timestamp: AUG_FIRST_LATE_MORNING,
			tempId: 'tmp-nf'
		});

		const registry = useStore.getState().chatsRegistry['room-nf'];
		expect(registry?.messages.map((message) => message.id)).toEqual(['msg-nf-1']);
		expect(registry?.messages[0]).toMatchObject({
			attachment: expect.objectContaining({ name: photoName, area: '640x480' })
		});
		// The placeholder stub has no real file id: it must stay out of the
		// gallery (a fake entry would never dedup against the refetched one)
		expect(galleryIds('room-nf')).toEqual([]);
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
			attachment: { id: 'att-1', name: 'foto.png', mimeType: pngMime, size: 10 }
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

	it('delivers the server-side attachment clone to the bubble and the gallery', () => {
		// v1 landed forwards through the plain message handler, gallery included
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore
			.getState()
			.appendMediaGalleryPage('room-fw', { sortBy: 'created_at', order: 'desc' }, [], 0, undefined);

		wsChatEventsRouter({
			...forwardedEvent('user-2'),
			attachmentId: cloneFileId,
			attachmentName: photoName,
			attachmentMime: pngMime,
			attachmentSize: 2048
		} as Parameters<typeof wsChatEventsRouter>[0]);

		const registry = useStore.getState().chatsRegistry['room-fw'];
		expect(registry?.messages[0]).toMatchObject({
			forwarded: expect.objectContaining({ from: 'user-9' }),
			attachment: { id: cloneFileId, name: photoName, mimeType: pngMime, size: 2048 }
		});
		const galleryState = useStore.getState().mediaGallery['room-fw'];
		expect(Object.values(galleryState?.buckets ?? {})[0]?.attachments[0]).toMatchObject({
			id: cloneFileId,
			userId: 'user-2',
			messageId: 'msg-fw'
		});
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

describe('wsChatEventsRouter - MessagePinned', () => {
	function pinnedEvent(roomId: string, messageId: string, pinnedBy: string): WsMessagePinnedEvent {
		return {
			type: WsEventType.MESSAGE_PINNED,
			roomId,
			messageId,
			pinnedBy,
			timestamp: AUG_FIRST_LATE_MORNING
		};
	}

	it('sets the banner from the loaded target and lands the v1 config row with the v1 effects', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-pin', [
			createMockTextMessage({
				id: 'msg-pin-1',
				stanzaId: 'msg-pin-1',
				roomId: 'room-pin',
				text: 'da fissare',
				date: Date.parse(AUG_FIRST_EARLY_MORNING)
			})
		]);
		const received: Array<unknown> = [];
		const listener = (event: Event): void => {
			received.push((event as CustomEvent).detail);
		};
		window.addEventListener(EventName.NEW_MESSAGE, listener);

		wsChatEventsRouter(pinnedEvent('room-pin', 'msg-pin-1', 'user-2'));
		window.removeEventListener(EventName.NEW_MESSAGE, listener);

		// Banner = the full store copy, not a stub (text comes from the store)
		expect(useStore.getState().activeConversations['room-pin']?.messagePinned).toMatchObject({
			id: 'msg-pin-1',
			text: 'da fissare'
		});
		const registry = useStore.getState().chatsRegistry['room-pin'];
		const row = registry?.messages.find(
			(message) => message.type === MessageType.CONFIGURATION_MSG
		);
		expect(row).toMatchObject({
			operation: OperationType.MESSAGE_PINNED,
			value: 'msg-pin-1',
			from: 'user-2'
		});
		expect(registry?.unread).toBe(1);
		expect(received).toEqual([
			expect.objectContaining({ operation: OperationType.MESSAGE_PINNED })
		]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('lands the own echo without touching the unread counter', () => {
		const ownPinTarget = 'msg-pown-1';
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-pown', [
			createMockTextMessage({
				id: ownPinTarget,
				stanzaId: ownPinTarget,
				roomId: 'room-pown',
				date: Date.parse(AUG_FIRST_EARLY_MORNING)
			})
		]);

		wsChatEventsRouter(pinnedEvent('room-pown', ownPinTarget, 'me'));

		expect(useStore.getState().activeConversations['room-pown']?.messagePinned).toBeDefined();
		expect(useStore.getState().chatsRegistry['room-pown']?.unread ?? 0).toBe(0);
	});

	it('hydrates an off-window target from GET /pin (the event is content-free)', async () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		mockJsonResponseOnce([
			{
				messageId: 'msg-far',
				roomId: 'room-pfar',
				pinnedBy: 'user-2',
				pinnedAt: AUG_FIRST_LATE_MORNING,
				text: 'testo dal DTO',
				senderId: 'user-9'
			}
		]);

		wsChatEventsRouter(pinnedEvent('room-pfar', 'msg-far', 'user-2'));
		await vi.advanceTimersByTimeAsync(0);

		expect((global.fetch as Mock).mock.calls[0]?.[0]).toBe('/services/chats/rooms/room-pfar/pin');
		expect(useStore.getState().activeConversations['room-pfar']?.messagePinned).toMatchObject({
			id: 'msg-far',
			text: 'testo dal DTO',
			from: 'user-9',
			date: Date.parse(AUG_FIRST_LATE_MORNING)
		});
	});

	it('pins a live-edited message with the edited text in the banner (v1 merged-copy parity)', () => {
		// The banner renders its copy as-is (no render-time projection like the
		// bubbles): the resolution must apply the latest EDIT fastening, as the
		// v1 handleEditedPinnedMessage merge did
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-ped', [
			createMockTextMessage({
				id: 'msg-ped-1',
				stanzaId: 'msg-ped-1',
				roomId: 'room-ped',
				text: 'testo prima della correzione',
				date: Date.parse(AUG_FIRST_EARLY_MORNING)
			})
		]);
		useStore.getState().addFastening([
			createMockMessageFastening({
				id: 'e_msg-ped-1_1754560000000',
				roomId: 'room-ped',
				action: FasteningAction.EDIT,
				originalStanzaId: 'msg-ped-1',
				value: 'testo corretto live',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);

		wsChatEventsRouter(pinnedEvent('room-ped', 'msg-ped-1', 'user-2'));

		expect(useStore.getState().activeConversations['room-ped']?.messagePinned).toMatchObject({
			id: 'msg-ped-1',
			text: 'testo corretto live',
			edited: true
		});
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('keeps one config row when the event is delivered twice (deterministic id)', () => {
		const dupPinTarget = 'msg-pdup-1';
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		useStore.getState().updateHistory('room-pdup', [
			createMockTextMessage({
				id: dupPinTarget,
				stanzaId: dupPinTarget,
				roomId: 'room-pdup',
				date: Date.parse(AUG_FIRST_EARLY_MORNING)
			})
		]);

		wsChatEventsRouter(pinnedEvent('room-pdup', dupPinTarget, 'user-2'));
		wsChatEventsRouter(pinnedEvent('room-pdup', dupPinTarget, 'user-2'));

		const rows = useStore
			.getState()
			.chatsRegistry[
				'room-pdup'
			]?.messages.filter((message) => message.type === MessageType.CONFIGURATION_MSG);
		expect(rows).toHaveLength(1);
	});
});

describe('wsChatEventsRouter - MessageUnpinned', () => {
	it('clears the banner and the scroll selection, lands the row and bumps unread for others', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });
		const pinned = createMockTextMessage({
			id: 'msg-up-1',
			stanzaId: 'msg-up-1',
			roomId: 'room-up',
			date: Date.parse(AUG_FIRST_EARLY_MORNING)
		});
		useStore.getState().newMessage(pinned);
		useStore.getState().setPinnedMessage('room-up', pinned);
		useStore.getState().setSelectedPinnedMessage('room-up', 'msg-up-1');

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_UNPINNED,
			roomId: 'room-up',
			messageId: 'msg-up-1',
			unpinnedBy: 'user-2',
			timestamp: AUG_FIRST_LATE_MORNING
		});

		const conversation = useStore.getState().activeConversations['room-up'];
		expect(conversation?.messagePinned).toBeUndefined();
		expect(conversation?.selectedPinnedMessage).toBeUndefined();
		const registry = useStore.getState().chatsRegistry['room-up'];
		const row = registry?.messages.find(
			(message) => message.type === MessageType.CONFIGURATION_MSG
		);
		expect(row).toMatchObject({ operation: OperationType.MESSAGE_UNPINNED, value: 'msg-up-1' });
		expect(registry?.unread).toBe(1);
		expect(global.fetch).not.toHaveBeenCalled();
	});
});

describe('wsChatEventsRouter - pinned banner maintenance', () => {
	it('refreshes the banner text when the pinned message is edited (v1 messagePinUpdated parity)', () => {
		const pinned = createMockTextMessage({
			id: 'msg-bm-1',
			stanzaId: 'msg-bm-1',
			roomId: 'room-bm',
			text: 'testo originale',
			date: Date.parse(AUG_FIRST_EARLY_MORNING)
		});
		useStore.getState().updateHistory('room-bm', [pinned]);
		useStore.getState().setPinnedMessage('room-bm', pinned);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_EDITED,
			messageId: 'msg-bm-1',
			roomId: 'room-bm',
			senderId: 'user-2',
			text: 'banner ritoccato',
			editedAt: AUG_FIRST_LATE_MORNING
		});

		expect(useStore.getState().activeConversations['room-bm']?.messagePinned).toMatchObject({
			id: 'msg-bm-1',
			text: 'banner ritoccato'
		});
	});

	it('leaves the banner alone when the edit targets another message', () => {
		const pinned = createMockTextMessage({
			id: 'msg-bo-1',
			stanzaId: 'msg-bo-1',
			roomId: 'room-bo',
			text: 'testo fissato',
			date: Date.parse(AUG_FIRST_EARLY_MORNING)
		});
		useStore.getState().updateHistory('room-bo', [
			pinned,
			createMockTextMessage({
				id: 'msg-bo-2',
				stanzaId: 'msg-bo-2',
				roomId: 'room-bo',
				date: Date.parse(AUG_FIRST_LATE_MORNING)
			})
		]);
		useStore.getState().setPinnedMessage('room-bo', pinned);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_EDITED,
			messageId: 'msg-bo-2',
			roomId: 'room-bo',
			senderId: 'user-2',
			text: 'altro testo',
			editedAt: AUG_FIRST_LATE_MORNING
		});

		expect(useStore.getState().activeConversations['room-bo']?.messagePinned).toMatchObject({
			text: 'testo fissato'
		});
	});

	it('drops the banner when the pinned message is deleted (defensive, plan §5.15)', () => {
		const pinned = createMockTextMessage({
			id: 'msg-bd-1',
			stanzaId: 'msg-bd-1',
			roomId: 'room-bd',
			date: Date.parse(AUG_FIRST_EARLY_MORNING)
		});
		useStore.getState().updateHistory('room-bd', [pinned]);
		useStore.getState().setPinnedMessage('room-bd', pinned);

		wsChatEventsRouter({
			type: WsEventType.MESSAGE_DELETED,
			messageId: 'msg-bd-1',
			roomId: 'room-bd',
			senderId: 'user-2',
			deletedAt: AUG_FIRST_LATE_MORNING
		});

		expect(useStore.getState().activeConversations['room-bd']?.messagePinned).toBeUndefined();
	});
});

describe('wsChatEventsRouter - Typing', () => {
	it('turns the indicator on and auto-expires it after 7s without refreshes', async () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter({
			type: WsEventType.TYPING,
			roomId: 'room-ty',
			userId: 'user-2',
			status: 'started',
			timestamp: AUG_FIRST_LATE_MORNING
		});
		expect(useStore.getState().activeConversations['room-ty']?.isWritingList).toEqual(['user-2']);

		await vi.advanceTimersByTimeAsync(7000);
		expect(useStore.getState().activeConversations['room-ty']?.isWritingList ?? []).toEqual([]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('treats a missing status as started and turns it off on stopped', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter({
			type: WsEventType.TYPING,
			roomId: 'room-tm',
			userId: 'user-2',
			timestamp: AUG_FIRST_LATE_MORNING
		});
		expect(useStore.getState().activeConversations['room-tm']?.isWritingList).toEqual(['user-2']);

		wsChatEventsRouter({
			type: WsEventType.TYPING,
			roomId: 'room-tm',
			userId: 'user-2',
			status: 'stopped',
			timestamp: AUG_FIRST_LATE_MORNING
		});
		expect(useStore.getState().activeConversations['room-tm']?.isWritingList ?? []).toEqual([]);
	});

	it('ignores the own echo (v1 parity: own chat states never reached the store)', () => {
		useStore.getState().setLoginInfo({ id: 'me', name: 'Me' });

		wsChatEventsRouter({
			type: WsEventType.TYPING,
			roomId: 'room-to',
			userId: 'me',
			status: 'started',
			timestamp: AUG_FIRST_LATE_MORNING
		});

		expect(useStore.getState().activeConversations['room-to']?.isWritingList ?? []).toEqual([]);
	});
});
