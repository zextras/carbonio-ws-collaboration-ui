/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { buildAttachmentForwardMessages } from './useAttachmentForward';
import { getRoomAttachments } from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { MessageType } from '../../../../types/store/ChatsRegistryTypes';
import { mockFetchAPI } from '../../../../utils/__mocks__/FetchUtils';
import { dateToTimestamp } from '../../../../utils/dateUtils';

vi.mock('../../../../utils/FetchUtils');

const CREATED_AT = '2024-01-01T10:00:00Z';

const buildAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
	id: 'att-id',
	name: 'file.png',
	size: 1024,
	mimeType: 'image/png',
	userId: 'user-1',
	roomId: 'room-1',
	createdAt: CREATED_AT,
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
				date: dateToTimestamp(CREATED_AT),
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

	test('a REST-shaped 2.0.0 attachment (messageId only) can be forwarded with its message id', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockFetchAPI.mockResolvedValueOnce({
			attachments: [
				{
					id: 'att-id',
					name: 'file.png',
					size: 1024,
					mimeType: 'image/png',
					userId: 'user-1',
					roomId: 'room-1',
					createdAt: CREATED_AT,
					messageId: 'msg-1'
				}
			]
		});

		const { attachments } = await getRoomAttachments('room-1', { limit: 20 });
		const messages = buildAttachmentForwardMessages(attachments[0]);

		expect(messages).toHaveLength(1);
		expect(messages?.[0].stanzaId).toBe('msg-1');
		useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
	});
});
