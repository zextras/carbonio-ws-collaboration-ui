/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryBucket,
	MediaGalleryFilter
} from '../../types/store/MediaGalleryTypes';
import { getMediaGalleryBucketKey } from '../../utils/attachmentUtils';
import useStore from '../Store';

const roomId = 'room-1';
const UNKNOWN_ROOM_ID = 'unknown-room';

const IMAGES_FILTER: MediaGalleryFilter = {
	...DEFAULT_MEDIA_GALLERY_FILTER,
	mimeTypeCategory: 'IMAGES'
};

const MINE_FILTER: MediaGalleryFilter = { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'user-1' };

const buildAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
	id: 'att-id',
	name: 'file.png',
	size: 1024,
	mimeType: 'image/png',
	userId: 'user-1',
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

const getBucket = (filter: MediaGalleryFilter, room = roomId): MediaGalleryBucket | undefined =>
	useStore.getState().mediaGallery[room]?.buckets[getMediaGalleryBucketKey(filter)];

describe('Media gallery slice', () => {
	test('appendMediaGalleryPage lazy-creates the room state and the bucket', () => {
		const att1 = buildAttachment({ id: 'a1' });
		useStore
			.getState()
			.appendMediaGalleryPage(roomId, DEFAULT_MEDIA_GALLERY_FILTER, [att1], 7, 'cursor-1');
		const bucket = getBucket(DEFAULT_MEDIA_GALLERY_FILTER);
		expect(bucket?.attachments).toEqual([att1]);
		expect(bucket?.filter).toEqual(DEFAULT_MEDIA_GALLERY_FILTER);
		expect(bucket?.total).toBe(7);
		expect(bucket?.nextCursor).toBe('cursor-1');
		expect(bucket?.hasMore).toBe(true);
		expect(bucket?.isInitialized).toBe(true);
		expect(bucket?.isLoading).toBe(false);
		expect(useStore.getState().mediaGallery[roomId].activeFilter).toEqual(
			DEFAULT_MEDIA_GALLERY_FILTER
		);
	});

	test('appendMediaGalleryPage accumulates pages and marks hasMore=false when no cursor is returned', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a1' })],
				2,
				'cursor-1'
			);
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a2' })],
				undefined,
				undefined
			);
		const bucket = getBucket(DEFAULT_MEDIA_GALLERY_FILTER);
		expect(bucket?.attachments.map((a) => a.id)).toEqual(['a1', 'a2']);
		expect(bucket?.nextCursor).toBeUndefined();
		expect(bucket?.hasMore).toBe(false);
		expect(bucket?.total).toBe(2);
	});

	test('pages fetched with different filters land in independent buckets', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a1' })],
				2,
				'cursor-1'
			);
		useStore
			.getState()
			.appendMediaGalleryPage(roomId, IMAGES_FILTER, [buildAttachment({ id: 'a2' })], 1, undefined);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual(['a1']);
		expect(getBucket(IMAGES_FILTER)?.attachments.map((a) => a.id)).toEqual(['a2']);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.hasMore).toBe(true);
		expect(getBucket(IMAGES_FILTER)?.hasMore).toBe(false);
	});

	test('setMediaGalleryLoading flips the loading flag of its bucket only', () => {
		useStore.getState().setMediaGalleryLoading(roomId, DEFAULT_MEDIA_GALLERY_FILTER, true);
		useStore.getState().setMediaGalleryLoading(roomId, IMAGES_FILTER, false);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.isLoading).toBe(true);
		expect(getBucket(IMAGES_FILTER)?.isLoading).toBe(false);
		useStore.getState().setMediaGalleryLoading(roomId, DEFAULT_MEDIA_GALLERY_FILTER, false);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.isLoading).toBe(false);
	});

	test('setMediaGalleryActiveFilter updates the filter and keeps every bucket cached', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a1' })],
				1,
				'cur-1'
			);
		useStore.getState().setMediaGalleryActiveFilter(roomId, MINE_FILTER);
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.activeFilter.userId).toBe('user-1');
		const bucket = getBucket(DEFAULT_MEDIA_GALLERY_FILTER);
		expect(bucket?.attachments).toHaveLength(1);
		expect(bucket?.nextCursor).toBe('cur-1');
		expect(bucket?.isInitialized).toBe(true);
	});

	test('setMediaGalleryActiveFilter is a no-op when the filter is unchanged', () => {
		useStore.getState().setMediaGalleryActiveFilter(roomId, DEFAULT_MEDIA_GALLERY_FILTER);
		const before = useStore.getState().mediaGallery[roomId];
		useStore.getState().setMediaGalleryActiveFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER });
		expect(useStore.getState().mediaGallery[roomId]).toBe(before);
	});

	test('removeMediaGalleryAttachment drops the attachment from every bucket and decrements totals', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a1' }), buildAttachment({ id: 'a2' })],
				2,
				'cur-1'
			);
		useStore
			.getState()
			.appendMediaGalleryPage(roomId, IMAGES_FILTER, [buildAttachment({ id: 'a1' })], 1, undefined);
		useStore.getState().removeMediaGalleryAttachment(roomId, 'a1');
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual(['a2']);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.total).toBe(1);
		expect(getBucket(IMAGES_FILTER)?.attachments).toEqual([]);
		expect(getBucket(IMAGES_FILTER)?.total).toBe(0);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.nextCursor).toBe('cur-1');
	});

	test('removeMediaGalleryAttachment is a no-op when the id is unknown', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				DEFAULT_MEDIA_GALLERY_FILTER,
				[buildAttachment({ id: 'a1' })],
				1,
				'cur-1'
			);
		useStore.getState().removeMediaGalleryAttachment(roomId, 'missing');
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual(['a1']);
		expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.total).toBe(1);
	});

	test('removeMediaGalleryAttachment is a no-op when the room is uninitialised', () => {
		useStore.getState().removeMediaGalleryAttachment(UNKNOWN_ROOM_ID, 'a1');
		expect(useStore.getState().mediaGallery[UNKNOWN_ROOM_ID]).toBeUndefined();
	});

	describe('prependMediaGalleryAttachment', () => {
		const NEW_ID = 'new';

		test('prepends a new attachment to every initialised bucket it matches and bumps totals', () => {
			useStore
				.getState()
				.appendMediaGalleryPage(
					roomId,
					DEFAULT_MEDIA_GALLERY_FILTER,
					[buildAttachment({ id: 'a1' })],
					1,
					'cur-1'
				);
			useStore.getState().appendMediaGalleryPage(roomId, IMAGES_FILTER, [], 0, undefined);
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID }));
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual([
				NEW_ID,
				'a1'
			]);
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.total).toBe(2);
			expect(getBucket(IMAGES_FILTER)?.attachments.map((a) => a.id)).toEqual([NEW_ID]);
			expect(getBucket(IMAGES_FILTER)?.total).toBe(1);
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.nextCursor).toBe('cur-1');
		});

		test('skips the buckets whose filter does not match the attachment', () => {
			useStore.getState().appendMediaGalleryPage(roomId, MINE_FILTER, [], 0, undefined);
			useStore.getState().appendMediaGalleryPage(roomId, IMAGES_FILTER, [], 0, undefined);
			useStore
				.getState()
				.prependMediaGalleryAttachment(
					roomId,
					buildAttachment({ id: NEW_ID, userId: 'someone-else', mimeType: 'application/pdf' })
				);
			expect(getBucket(MINE_FILTER)?.attachments).toEqual([]);
			expect(getBucket(IMAGES_FILTER)?.attachments).toEqual([]);
		});

		test('skips buckets not sorted by descending creation date', () => {
			const ASC_FILTER: MediaGalleryFilter = { sortBy: 'created_at', order: 'asc' };
			useStore.getState().appendMediaGalleryPage(roomId, ASC_FILTER, [], 0, undefined);
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID }));
			expect(getBucket(ASC_FILTER)?.attachments).toEqual([]);
		});

		test('skips when the room state is missing or the bucket is not yet initialised', () => {
			useStore.getState().prependMediaGalleryAttachment(UNKNOWN_ROOM_ID, buildAttachment());
			expect(useStore.getState().mediaGallery[UNKNOWN_ROOM_ID]).toBeUndefined();

			useStore.getState().setMediaGalleryLoading(roomId, DEFAULT_MEDIA_GALLERY_FILTER, true);
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID }));
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments).toEqual([]);
		});

		test('skips when the attachment id is already in the bucket', () => {
			useStore
				.getState()
				.appendMediaGalleryPage(
					roomId,
					DEFAULT_MEDIA_GALLERY_FILTER,
					[buildAttachment({ id: 'a1' })],
					1,
					'cur-1'
				);
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: 'a1' }));
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.attachments.map((a) => a.id)).toEqual(['a1']);
			expect(getBucket(DEFAULT_MEDIA_GALLERY_FILTER)?.total).toBe(1);
		});
	});
});
