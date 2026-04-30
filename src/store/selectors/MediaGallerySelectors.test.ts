/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import useStore from '../Store';
import {
	getMediaGalleryAttachments,
	getMediaGalleryHasMore,
	getMediaGalleryIsInitialized,
	getMediaGalleryIsLoading
} from './MediaGallerySelectors';

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

describe('Media gallery selectors', () => {
	test('return sane defaults when the room has no state yet', () => {
		const store = useStore.getState();
		expect(getMediaGalleryAttachments(store, 'missing')).toEqual([]);
		expect(getMediaGalleryHasMore(store, 'missing')).toBe(true);
		expect(getMediaGalleryIsLoading(store, 'missing')).toBe(false);
		expect(getMediaGalleryIsInitialized(store, 'missing')).toBe(false);
	});

	test('reflect the populated room state', () => {
		const att = buildAttachment('a1');
		useStore.getState().appendMediaGalleryPage(roomId, [att], 'cursor-1');
		const store = useStore.getState();
		expect(getMediaGalleryAttachments(store, roomId)).toEqual([att]);
		expect(getMediaGalleryHasMore(store, roomId)).toBe(true);
		expect(getMediaGalleryIsInitialized(store, roomId)).toBe(true);
	});
});
