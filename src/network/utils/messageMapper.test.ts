/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';

import { mapChatMessageToTextMessage } from './messageMapper';
import { ChatMessage } from '../../types/network/models/chatTypes';

const currentUserId = 'me';
const originalCreatedAt = '2026-09-09T09:00:00.000Z';

const baseChatMessage = (fields?: Partial<ChatMessage>): ChatMessage => ({
	id: 'msg-1',
	roomId: 'room-1',
	senderId: 'user-a',
	text: 'hello',
	createdAt: '2026-09-09T10:00:00.000Z',
	...fields
});

describe('mapChatMessageToTextMessage - repliedMessage', () => {
	test('embeds the full replied message content from repliedMessage', () => {
		const original = baseChatMessage({
			id: 'orig-1',
			senderId: 'user-b',
			text: 'the original',
			createdAt: originalCreatedAt
		});
		const reply = baseChatMessage({
			id: 'reply-1',
			text: 'the reply',
			replyToId: 'orig-1',
			repliedMessage: original
		});

		const result = mapChatMessageToTextMessage(reply, currentUserId);

		expect(result.repliedMessage).toBeDefined();
		expect(result.repliedMessage?.id).toBe('orig-1');
		expect(result.repliedMessage?.from).toBe('user-b');
		expect(result.repliedMessage?.text).toBe('the original');
		expect(result.repliedMessage?.date).toBe(new Date(originalCreatedAt).getTime());
	});

	test('carries the embedded attachment of the replied message', () => {
		const reply = baseChatMessage({
			id: 'reply-att',
			replyToId: 'orig-att',
			repliedMessage: baseChatMessage({
				id: 'orig-att',
				text: '',
				attachment: {
					id: 'file-1',
					name: 'photo.png',
					mimeType: 'image/png',
					size: 1234,
					userId: 'user-b',
					roomId: 'room-1',
					createdAt: originalCreatedAt
				}
			})
		});

		const result = mapChatMessageToTextMessage(reply, currentUserId);

		expect(result.repliedMessage?.attachment?.id).toBe('file-1');
		expect(result.repliedMessage?.attachment?.name).toBe('photo.png');
	});

	test('falls back to a stub from replyToId when the original is not embedded', () => {
		const reply = baseChatMessage({
			id: 'reply-2',
			text: 'orphan reply',
			replyToId: 'missing-orig'
		});

		const result = mapChatMessageToTextMessage(reply, currentUserId);

		expect(result.repliedMessage).toBeDefined();
		expect(result.repliedMessage?.id).toBe('missing-orig');
		expect(result.repliedMessage?.from).toBe('');
		expect(result.repliedMessage?.text).toBe('');
	});

	test('leaves repliedMessage undefined for a non-reply message', () => {
		const result = mapChatMessageToTextMessage(baseChatMessage(), currentUserId);
		expect(result.repliedMessage).toBeUndefined();
	});

	test('marks a deleted embedded original as deleted with empty text', () => {
		const reply = baseChatMessage({
			id: 'reply-3',
			replyToId: 'orig-3',
			repliedMessage: baseChatMessage({
				id: 'orig-3',
				text: 'gone',
				deletedInfo: { deletedBy: 'user-b', deletedAt: '2026-09-09T09:30:00.000Z' }
			})
		});

		const result = mapChatMessageToTextMessage(reply, currentUserId);

		expect(result.repliedMessage?.id).toBe('orig-3');
		expect(result.repliedMessage?.deleted).toBe(true);
		expect(result.repliedMessage?.text).toBe('');
	});
});
