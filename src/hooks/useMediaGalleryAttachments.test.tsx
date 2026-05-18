/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { MEDIA_GALLERY_PAGE_SIZE, useMediaGalleryAttachments } from './useMediaGalleryAttachments';
import { getRoomAttachments } from '../network';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../types/store/MediaGalleryTypes';

vi.mock('../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);

const roomId = 'room-1';

const buildAttachment = (id: string): Attachment => ({
	id,
	name: `${id}.txt`,
	size: 1024,
	mimeType: 'text/plain',
	userId: 'u',
	roomId,
	createdAt: '2024-01-01T10:00:00Z'
});

beforeEach(() => {
	mockedGetRoomAttachments.mockReset();
});

describe('useMediaGalleryAttachments', () => {
	test('fires the first fetch with no cursor on mount', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1')],
			cursor: 'cursor-1'
		});

		renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(roomId, {
				limit: MEDIA_GALLERY_PAGE_SIZE,
				cursor: undefined,
				userId: undefined,
				sortBy: 'created_at',
				order: 'desc'
			});
		});

		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId].attachments).toHaveLength(1);
		});
	});

	test('loadMore forwards the next cursor and appends results', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1')],
			cursor: 'cursor-1'
		});

		const { result } = renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a2')],
			cursor: undefined
		});

		await act(async () => {
			result.current.loadMore();
		});

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});

		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(roomId, {
			limit: MEDIA_GALLERY_PAGE_SIZE,
			cursor: 'cursor-1',
			userId: undefined,
			sortBy: 'created_at',
			order: 'desc'
		});

		await waitFor(() => {
			const state = useStore.getState().mediaGallery[roomId];
			expect(state.attachments.map((a) => a.id)).toEqual(['a1', 'a2']);
			expect(state.hasMore).toBe(false);
		});
	});

	test('loadMore is a no-op when there are no more pages', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1')],
			cursor: undefined
		});

		const { result } = renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		expect(result.current.hasMore).toBe(false);

		const callsBefore = mockedGetRoomAttachments.mock.calls.length;
		await act(async () => {
			result.current.loadMore();
		});
		expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(callsBefore);
	});

	test('refetches the first page when the filter changes', async () => {
		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('a1')],
			cursor: 'cursor-1'
		});

		const { result } = renderHook(() => useMediaGalleryAttachments(roomId));
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		mockedGetRoomAttachments.mockResolvedValueOnce({
			attachments: [buildAttachment('mine-1')],
			cursor: undefined
		});

		await act(async () => {
			useStore
				.getState()
				.setMediaGalleryFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
		});

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});

		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(roomId, {
			limit: MEDIA_GALLERY_PAGE_SIZE,
			cursor: undefined,
			userId: 'me',
			sortBy: 'created_at',
			order: 'desc'
		});

		await waitFor(() => {
			const state = useStore.getState().mediaGallery[roomId];
			expect(state.attachments.map((a) => a.id)).toEqual(['mine-1']);
		});
	});

	test('keeps loading=false on fetch error and logs to console', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		mockedGetRoomAttachments.mockRejectedValue(new Error('boom'));

		renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => {
			expect(useStore.getState().mediaGallery[roomId]?.isLoading).toBe(false);
		});
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
