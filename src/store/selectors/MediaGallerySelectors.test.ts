/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../../types/store/MediaGalleryTypes';
import { getMediaGalleryBucketKey } from '../../utils/attachmentUtils';
import useStore from '../Store';
import {
	getMediaGalleryActiveFilter,
	getMediaGalleryAttachments,
	getMediaGalleryHasMore,
	getMediaGalleryIsInitialized,
	getMediaGalleryIsLoading,
	getMediaGalleryTotal
} from './MediaGallerySelectors';

const roomId = 'room-1';
const FILTER_KEY = getMediaGalleryBucketKey(DEFAULT_MEDIA_GALLERY_FILTER);

const buildAttachment = (id: string): Attachment => ({
	id,
	name: `${id}.txt`,
	size: 1024,
	mimeType: 'text/plain',
	userId: 'u',
	roomId,
	createdAt: '2024-01-01T10:00:00Z'
});

describe('Media gallery selectors', () => {
	test('return sane defaults when the bucket does not exist yet', () => {
		const store = useStore.getState();
		expect(getMediaGalleryAttachments(store, 'missing', FILTER_KEY)).toEqual([]);
		expect(getMediaGalleryHasMore(store, 'missing', FILTER_KEY)).toBe(true);
		expect(getMediaGalleryIsLoading(store, 'missing', FILTER_KEY)).toBe(false);
		expect(getMediaGalleryIsInitialized(store, 'missing', FILTER_KEY)).toBe(false);
		expect(getMediaGalleryTotal(store, 'missing', FILTER_KEY)).toBeUndefined();
		expect(getMediaGalleryActiveFilter(store, 'missing')).toEqual(DEFAULT_MEDIA_GALLERY_FILTER);
	});

	test('getMediaGalleryAttachments returns a stable reference while the bucket is missing', () => {
		const store = useStore.getState();
		expect(getMediaGalleryAttachments(store, 'missing', FILTER_KEY)).toBe(
			getMediaGalleryAttachments(store, 'other-missing', FILTER_KEY)
		);
	});

	test('reflect the populated bucket state', () => {
		const att = buildAttachment('a1');
		useStore
			.getState()
			.appendMediaGalleryPage(roomId, DEFAULT_MEDIA_GALLERY_FILTER, [att], 9, 'cursor-1');
		const store = useStore.getState();
		expect(getMediaGalleryAttachments(store, roomId, FILTER_KEY)).toEqual([att]);
		expect(getMediaGalleryHasMore(store, roomId, FILTER_KEY)).toBe(true);
		expect(getMediaGalleryIsInitialized(store, roomId, FILTER_KEY)).toBe(true);
		expect(getMediaGalleryTotal(store, roomId, FILTER_KEY)).toBe(9);
	});

	test('getMediaGalleryActiveFilter returns the room filter once it has been set', () => {
		useStore
			.getState()
			.setMediaGalleryActiveFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
		const store = useStore.getState();
		expect(getMediaGalleryActiveFilter(store, roomId).userId).toBe('me');
	});
});
