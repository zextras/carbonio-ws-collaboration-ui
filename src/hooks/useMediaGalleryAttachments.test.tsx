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
import {
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryBucket,
	MediaGalleryFilter
} from '../types/store/MediaGalleryTypes';
import { getMediaGalleryBucketKey } from '../utils/attachmentUtils';

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

const getBucket = (filter: MediaGalleryFilter): MediaGalleryBucket | undefined =>
	useStore.getState().mediaGallery[roomId]?.buckets[getMediaGalleryBucketKey(filter)];

beforeEach(() => {
	mockedGetRoomAttachments.mockReset();
});

describe('useMediaGalleryAttachments', () => {
	test('fires the first fetch with no cursor on mount and stores the total', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('a1')],
			cursor: 'cursor-1',
			total: 5
		});

		const { result } = renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(roomId, {
				limit: MEDIA_GALLERY_PAGE_SIZE,
				cursor: undefined,
				userId: undefined,
				mimeTypeCategory: undefined,
				sortBy: 'created_at',
				order: 'desc'
			});
		});

		await waitFor(() => {
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments).toHaveLength(1);
		});
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.total).toBe(5);
		await waitFor(() => expect(result.current.total).toBe(5));
	});

	test('sends the category to the API and buckets the page by category', async () => {
		mockedGetRoomAttachments.mockResolvedValue({
			attachments: [buildAttachment('img-1')],
			cursor: undefined,
			total: 1
		});

		renderHook(() => useMediaGalleryAttachments(roomId, 'IMAGES'));

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledWith(
				roomId,
				expect.objectContaining({ mimeTypeCategory: 'IMAGES' })
			);
		});

		await waitFor(() => {
			expect(
				getBucket({ ...DEFAULT_MEDIA_GALLERY_FILTER, mimeTypeCategory: 'IMAGES' })?.attachments
			).toHaveLength(1);
		});
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)).toBeUndefined();
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

		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(
			roomId,
			expect.objectContaining({ limit: MEDIA_GALLERY_PAGE_SIZE, cursor: 'cursor-1' })
		);

		await waitFor(() => {
			const bucket = getBucket(DEFAULT_MEDIA_GALLERY_FILTER);
			expect(bucket?.attachments.map((a) => a.id)).toEqual(['a1', 'a2']);
			expect(bucket?.hasMore).toBe(false);
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

	test('changing the user filter fetches a new bucket and switching back reuses the cache', async () => {
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

		act(() => {
			result.current.setActiveFilter({ ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
		});

		await waitFor(() => {
			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
		});
		expect(mockedGetRoomAttachments).toHaveBeenLastCalledWith(
			roomId,
			expect.objectContaining({ userId: 'me', cursor: undefined })
		);
		await waitFor(() => {
			expect(result.current.attachments.map((a) => a.id)).toEqual(['mine-1']);
		});
		// The unfiltered bucket is still cached...
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual(['a1']);

		// ...so switching back must not fire another request.
		act(() => {
			result.current.setActiveFilter(DEFAULT_MEDIA_GALLERY_FILTER);
		});
		await waitFor(() => {
			expect(result.current.attachments.map((a) => a.id)).toEqual(['a1']);
		});
		expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
	});

	test('keeps loading=false on fetch error and logs to console', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		mockedGetRoomAttachments.mockRejectedValue(new Error('boom'));

		renderHook(() => useMediaGalleryAttachments(roomId));

		await waitFor(() => {
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.isLoading).toBe(false);
		});
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
