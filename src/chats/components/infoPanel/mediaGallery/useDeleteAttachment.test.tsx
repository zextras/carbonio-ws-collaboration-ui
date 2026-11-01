/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import useDeleteAttachment from './useDeleteAttachment';
import { bulkDeleteRoomAttachments } from '../../../../network';
import { chatClient } from '../../../../network/chatClient/ChatClient';
import { ProvidersWrapper } from '../../../../tests/test-utils';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

vi.mock('../../../../network', async (importOriginal) => ({
	...(await importOriginal<object>()),
	bulkDeleteRoomAttachments: vi.fn()
}));

const restShaped2Attachment: Attachment = {
	id: 'att-id',
	name: 'file.png',
	size: 1024,
	mimeType: 'image/png',
	userId: 'user-1',
	roomId: 'room-1',
	createdAt: '2024-01-01T10:00:00Z',
	messageId: 'msg-1',
	stanzaId: 'msg-1'
};

describe('useDeleteAttachment', () => {
	test('deleting a 2.0.0 gallery attachment retracts its message with the message id', async () => {
		vi.mocked(bulkDeleteRoomAttachments).mockResolvedValue({
			successIds: ['att-id'],
			failedIds: []
		});
		const spy = vi.spyOn(chatClient, 'sendChatMessageDeletion').mockImplementation(() => undefined);
		const { result } = renderHook(() => useDeleteAttachment([restShaped2Attachment]), {
			wrapper: ProvidersWrapper
		});

		act(() => result.current.confirmDelete());

		await waitFor(() => expect(spy).toHaveBeenCalledWith('room-1', 'msg-1'));
	});
});
