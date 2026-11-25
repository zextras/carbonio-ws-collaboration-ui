/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import useDeleteAttachment from './useDeleteAttachment';
import { bulkDeleteRoomAttachments } from '../../../../network';
import { getRoomAttachments } from '../../../../network/apis/RoomsApi';
import { chatClient } from '../../../../network/chatClient/ChatClient';
import useStore from '../../../../store/Store';
import { ProvidersWrapper } from '../../../../tests/test-utils';
import { mockFetchAPI } from '../../../../utils/__mocks__/FetchUtils';

vi.mock('../../../../utils/FetchUtils');
vi.mock('../../../../network', async (importOriginal) => ({
	...(await importOriginal<object>()),
	bulkDeleteRoomAttachments: vi.fn()
}));

const restItem = {
	id: 'att-id',
	name: 'file.png',
	size: 1024,
	mimeType: 'image/png',
	userId: 'user-1',
	roomId: 'room-1',
	createdAt: '2024-01-01T10:00:00Z',
	messageId: 'msg-1'
};

afterEach(() => {
	useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
});

describe('useDeleteAttachment', () => {
	test('deleting a REST-shaped 2.0.0 gallery attachment (messageId only) retracts its message', async () => {
		useStore.getState().setApiVersion('2.0.0');
		mockFetchAPI.mockResolvedValueOnce({ attachments: [restItem] });
		const { attachments } = await getRoomAttachments('room-1', { limit: 20 });
		vi.mocked(bulkDeleteRoomAttachments).mockResolvedValue({
			successIds: ['att-id'],
			failedIds: []
		});
		const spy = vi.spyOn(chatClient, 'sendChatMessageDeletion').mockImplementation(() => undefined);
		const { result } = renderHook(() => useDeleteAttachment(attachments), {
			wrapper: ProvidersWrapper
		});

		act(() => result.current.confirmDelete());

		await waitFor(() => expect(spy).toHaveBeenCalledWith('room-1', 'msg-1'));
	});
});
