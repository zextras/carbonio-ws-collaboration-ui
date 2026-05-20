/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import usePreviewNavigation, { PREVIEW_NAVIGATION_PAGE_SIZE } from './usePreviewNavigation';
import { getRoomAttachments } from '../network';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';
import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../types/store/MediaGalleryTypes';

vi.mock('../network/apis/RoomsApi', () => ({
	getRoomAttachments: vi.fn()
}));

const mockedGetRoomAttachments = vi.mocked(getRoomAttachments);

const roomId = 'room-1';

const buildAttachment = (id: string, overrides?: Partial<Attachment>): Attachment => ({
	id,
	name: `${id}.png`,
	size: 1024,
	mimeType: 'image/png',
	userId: 'u',
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

const buildClickedMessage = (id: string): AttachmentMessageType => ({
	id,
	name: `${id}.png`,
	mimeType: 'image/png',
	size: 1024
});

beforeEach(() => {
	mockedGetRoomAttachments.mockReset();
	useStore.getState().clearPreviewNavigation();
	useStore.setState({ mediaGallery: {} });
});

describe('usePreviewNavigation', () => {
	describe('openFromGallery', () => {
		test('snapshots the current gallery state into the new session', () => {
			const a1 = buildAttachment('a1');
			const a2 = buildAttachment('a2');
			useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], 'cursor-x');
			useStore
				.getState()
				.setMediaGalleryFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
			// setMediaGalleryFilter wipes attachments on filter change, so re-seed.
			useStore.getState().appendMediaGalleryPage(roomId, [a1, a2], 'cursor-x');

			const { result } = renderHook(() => usePreviewNavigation());
			act(() => {
				result.current.openFromGallery(roomId, a1);
			});

			const { active } = useStore.getState().previewNavigation;
			expect(active?.source).toBe('gallery');
			expect(active?.roomId).toBe(roomId);
			expect(active?.attachments.map((a) => a.id)).toEqual(['a1', 'a2']);
			expect(active?.nextCursor).toBe('cursor-x');
			expect(active?.hasMore).toBe(true);
			expect(active?.userId).toBe('me');
			expect(active?.openTargetId).toBe('a1');
		});

		test('falls back to safe defaults when the gallery has no state yet', () => {
			const { result } = renderHook(() => usePreviewNavigation());
			const clicked = buildAttachment('a1');
			act(() => {
				result.current.openFromGallery(roomId, clicked);
			});
			const { active } = useStore.getState().previewNavigation;
			expect(active?.attachments).toEqual([]);
			expect(active?.hasMore).toBe(true);
			expect(active?.nextCursor).toBeUndefined();
		});
	});

	describe('openFromChat', () => {
		test('initializes the session and fires a single anchored API call when the first page contains the target', async () => {
			const target = buildAttachment('a-target');
			mockedGetRoomAttachments.mockResolvedValueOnce({
				attachments: [buildAttachment('a-newer'), target, buildAttachment('a-older')],
				cursor: 'next-cursor'
			});

			const { result } = renderHook(() => usePreviewNavigation());
			const messageDate = Date.parse('2024-01-15T12:00:00Z');

			await act(async () => {
				await result.current.openFromChat(roomId, buildClickedMessage('a-target'), messageDate);
			});

			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(1);
			const callArgs = mockedGetRoomAttachments.mock.calls[0][1];
			expect(callArgs.limit).toBe(PREVIEW_NAVIGATION_PAGE_SIZE);
			expect(callArgs.sortBy).toBe('created_at');
			expect(callArgs.order).toBe('desc');
			expect(callArgs.createdBefore).toBeDefined();
			expect(callArgs.cursor).toBeUndefined();

			const { active } = useStore.getState().previewNavigation;
			expect(active?.source).toBe('chat');
			expect(active?.attachments.map((a) => a.id)).toEqual(['a-newer', 'a-target', 'a-older']);
			expect(active?.isLoading).toBe(false);
		});

		test('keeps fetching with the cursor until the clicked attachment is found', async () => {
			mockedGetRoomAttachments
				.mockResolvedValueOnce({
					attachments: [buildAttachment('a-newer-1'), buildAttachment('a-newer-2')],
					cursor: 'cursor-1'
				})
				.mockResolvedValueOnce({
					attachments: [buildAttachment('a-target')],
					cursor: 'cursor-2'
				});

			const { result } = renderHook(() => usePreviewNavigation());

			await act(async () => {
				await result.current.openFromChat(roomId, buildClickedMessage('a-target'), 0);
			});

			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
			expect(mockedGetRoomAttachments.mock.calls[1][1].cursor).toBe('cursor-1');
			expect(mockedGetRoomAttachments.mock.calls[1][1].createdBefore).toBeUndefined();

			const { active } = useStore.getState().previewNavigation;
			expect(active?.attachments.map((a) => a.id)).toEqual(['a-newer-1', 'a-newer-2', 'a-target']);
		});

		test('stops fetching when the cursor is exhausted even without finding the target', async () => {
			mockedGetRoomAttachments
				.mockResolvedValueOnce({
					attachments: [buildAttachment('a-newer-1')],
					cursor: 'cursor-1'
				})
				.mockResolvedValueOnce({
					attachments: [buildAttachment('a-older')],
					cursor: undefined
				});

			const { result } = renderHook(() => usePreviewNavigation());

			await act(async () => {
				await result.current.openFromChat(roomId, buildClickedMessage('a-missing'), 0);
			});

			expect(mockedGetRoomAttachments).toHaveBeenCalledTimes(2);
			const { active } = useStore.getState().previewNavigation;
			expect(active?.hasMore).toBe(false);
		});

		test('bails when the active session no longer matches between fetches', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			mockedGetRoomAttachments
				.mockResolvedValueOnce({
					attachments: [buildAttachment('a-newer')],
					cursor: 'cursor-1'
				})
				.mockImplementationOnce(async () => {
					useStore.getState().clearPreviewNavigation();
					return { attachments: [buildAttachment('a-target')], cursor: undefined };
				});

			const { result } = renderHook(() => usePreviewNavigation());
			await act(async () => {
				await result.current.openFromChat(roomId, buildClickedMessage('a-target'), 0);
			});

			expect(useStore.getState().previewNavigation.active).toBeNull();
			consoleSpy.mockRestore();
		});

		test('logs and resets loading state on fetch error', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			mockedGetRoomAttachments.mockRejectedValueOnce(new Error('boom'));

			const { result } = renderHook(() => usePreviewNavigation());
			await act(async () => {
				await result.current.openFromChat(roomId, buildClickedMessage('a-x'), 0);
			});

			await waitFor(() => {
				expect(useStore.getState().previewNavigation.active?.isLoading).toBe(false);
			});
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
