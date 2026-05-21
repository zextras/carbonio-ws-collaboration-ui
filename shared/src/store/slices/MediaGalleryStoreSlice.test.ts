/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../../types/store/MediaGalleryTypes';
import useStore from '../Store';

const roomId = 'room-1';
const UNKNOWN_ROOM_ID = 'unknown-room';

const buildAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
	id: 'att-id',
	name: 'file.txt',
	size: 1024,
	mimeType: 'text/plain',
	userId: 'user-1',
	roomId,
	createdAt: '2024-01-01T10:00:00Z',
	...overrides
});

describe('Media gallery slice', () => {
	test('appendMediaGalleryPage lazy-creates the room state with default filter', () => {
		const att1 = buildAttachment({ id: 'a1' });
		useStore.getState().appendMediaGalleryPage(roomId, [att1], 'cursor-1');
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.attachments).toEqual([att1]);
		expect(state.nextCursor).toBe('cursor-1');
		expect(state.hasMore).toBe(true);
		expect(state.isInitialized).toBe(true);
		expect(state.isLoading).toBe(false);
		expect(state.filter).toEqual(DEFAULT_MEDIA_GALLERY_FILTER);
	});

	test('appendMediaGalleryPage marks hasMore=false when no cursor is returned', () => {
		const att1 = buildAttachment({ id: 'a1' });
		const att2 = buildAttachment({ id: 'a2' });
		useStore.getState().appendMediaGalleryPage(roomId, [att1], 'cursor-1');
		useStore.getState().appendMediaGalleryPage(roomId, [att2], undefined);
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.attachments.map((a) => a.id)).toEqual(['a1', 'a2']);
		expect(state.nextCursor).toBeUndefined();
		expect(state.hasMore).toBe(false);
	});

	test('setMediaGalleryLoading flips the loading flag and lazy-creates the room state', () => {
		useStore.getState().setMediaGalleryLoading(roomId, true);
		expect(useStore.getState().mediaGallery[roomId].isLoading).toBe(true);
		useStore.getState().setMediaGalleryLoading(roomId, false);
		expect(useStore.getState().mediaGallery[roomId].isLoading).toBe(false);
	});

	test('setMediaGalleryFilter applies the new filter and resets pagination state', () => {
		useStore.getState().appendMediaGalleryPage(roomId, [buildAttachment({ id: 'a1' })], 'cur-1');
		useStore
			.getState()
			.setMediaGalleryFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.filter.userId).toBe('me');
		expect(state.attachments).toEqual([]);
		expect(state.nextCursor).toBeUndefined();
		expect(state.hasMore).toBe(true);
		expect(state.isInitialized).toBe(false);
		expect(state.isLoading).toBe(false);
	});

	test('setMediaGalleryFilter is a no-op when the filter is unchanged', () => {
		useStore.getState().appendMediaGalleryPage(roomId, [buildAttachment({ id: 'a1' })], 'cur-1');
		useStore.getState().setMediaGalleryFilter(roomId, DEFAULT_MEDIA_GALLERY_FILTER);
		const state = useStore.getState().mediaGallery[roomId];
		// pagination state was preserved because the filter did not change
		expect(state.attachments).toHaveLength(1);
		expect(state.nextCursor).toBe('cur-1');
		expect(state.isInitialized).toBe(true);
	});

	test('removeMediaGalleryAttachment drops the attachment by id and preserves pagination', () => {
		useStore
			.getState()
			.appendMediaGalleryPage(
				roomId,
				[
					buildAttachment({ id: 'a1' }),
					buildAttachment({ id: 'a2' }),
					buildAttachment({ id: 'a3' })
				],
				'cur-1'
			);
		useStore.getState().removeMediaGalleryAttachment(roomId, 'a2');
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.attachments.map((a) => a.id)).toEqual(['a1', 'a3']);
		expect(state.nextCursor).toBe('cur-1');
		expect(state.hasMore).toBe(true);
	});

	test('removeMediaGalleryAttachment is a no-op when the id is unknown', () => {
		useStore.getState().appendMediaGalleryPage(roomId, [buildAttachment({ id: 'a1' })], 'cur-1');
		useStore.getState().removeMediaGalleryAttachment(roomId, 'missing');
		const state = useStore.getState().mediaGallery[roomId];
		expect(state.attachments.map((a) => a.id)).toEqual(['a1']);
	});

	test('removeMediaGalleryAttachment is a no-op when the room is uninitialised', () => {
		useStore.getState().removeMediaGalleryAttachment(UNKNOWN_ROOM_ID, 'a1');
		expect(useStore.getState().mediaGallery[UNKNOWN_ROOM_ID]).toBeUndefined();
	});

	describe('prependMediaGalleryAttachment', () => {
		const NEW_ID = 'new';

		test('prepends a new attachment when the gallery is initialised', () => {
			useStore.getState().appendMediaGalleryPage(roomId, [buildAttachment({ id: 'a1' })], 'cur-1');
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID }));
			const state = useStore.getState().mediaGallery[roomId];
			expect(state.attachments.map((a) => a.id)).toEqual([NEW_ID, 'a1']);
			expect(state.nextCursor).toBe('cur-1');
		});

		test('skips when the room state is missing or not yet initialised', () => {
			useStore.getState().prependMediaGalleryAttachment(UNKNOWN_ROOM_ID, buildAttachment());
			expect(useStore.getState().mediaGallery[UNKNOWN_ROOM_ID]).toBeUndefined();

			useStore.getState().setMediaGalleryLoading(roomId, true);
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID }));
			expect(useStore.getState().mediaGallery[roomId].attachments).toEqual([]);
		});

		test('skips when the userId filter does not match the attachment sender', () => {
			useStore.getState().appendMediaGalleryPage(roomId, [], undefined);
			useStore
				.getState()
				.setMediaGalleryFilter(roomId, { ...DEFAULT_MEDIA_GALLERY_FILTER, userId: 'me' });
			useStore.getState().appendMediaGalleryPage(roomId, [], undefined);
			useStore
				.getState()
				.prependMediaGalleryAttachment(roomId, buildAttachment({ id: NEW_ID, userId: 'someone' }));
			expect(useStore.getState().mediaGallery[roomId].attachments).toEqual([]);
		});

		test('skips when the attachment id is already in the list', () => {
			useStore.getState().appendMediaGalleryPage(roomId, [buildAttachment({ id: 'a1' })], 'cur-1');
			useStore.getState().prependMediaGalleryAttachment(roomId, buildAttachment({ id: 'a1' }));
			expect(useStore.getState().mediaGallery[roomId].attachments.map((a) => a.id)).toEqual(['a1']);
		});
	});
});
