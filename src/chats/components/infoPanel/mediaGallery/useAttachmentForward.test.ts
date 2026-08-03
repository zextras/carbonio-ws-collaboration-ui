/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { buildAttachmentForwardMessages } from './useAttachmentForward';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { MessageType } from '../../../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../../../utils/dateUtils';

const buildAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
	id: 'att-id',
	name: 'file.png',
	size: 1024,
	mimeType: 'image/png',
	userId: 'user-1',
	roomId: 'room-1',
	createdAt: '2024-01-01T10:00:00Z',
	stanzaId: 'stanza-1',
	...overrides
});

describe('buildAttachmentForwardMessages', () => {
	test('builds the message the forward API needs from the attachment metadata', () => {
		const attachment = buildAttachment({ messageId: 'message-1' });

		expect(buildAttachmentForwardMessages(attachment)).toEqual([
			{
				id: 'message-1',
				roomId: 'room-1',
				date: dateToTimestamp('2024-01-01T10:00:00Z'),
				stanzaId: 'stanza-1',
				type: MessageType.TEXT_MSG,
				from: 'user-1',
				text: '',
				read: expect.anything(),
				attachment: {
					id: 'att-id',
					name: 'file.png',
					mimeType: 'image/png',
					size: 1024
				}
			}
		]);
	});

	test('carries the attachment field so forwarding triggers the quota refresh', () => {
		const messages = buildAttachmentForwardMessages(buildAttachment());

		expect(messages?.some((message) => message.attachment)).toBe(true);
	});

	test('falls back to the stanzaId when the message id is unknown', () => {
		const messages = buildAttachmentForwardMessages(buildAttachment({ messageId: undefined }));

		expect(messages?.[0].id).toBe('stanza-1');
	});

	test('returns undefined when the original stanzaId is unknown', () => {
		expect(
			buildAttachmentForwardMessages(buildAttachment({ stanzaId: undefined }))
		).toBeUndefined();
	});
});
