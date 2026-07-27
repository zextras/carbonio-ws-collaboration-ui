/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryActiveFilter,
	MediaGalleryBucket,
	MediaGalleryFilter,
	MediaGalleryRoomState,
	MediaGalleryStoreSlice
} from '../../types/store/MediaGalleryTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { attachmentMatchesFilter, getMediaGalleryBucketKey } from '../../utils/attachmentUtils';

const emptyBucket = (filter: MediaGalleryFilter): MediaGalleryBucket => ({
	filter,
	attachments: [],
	total: undefined,
	nextCursor: undefined,
	hasMore: true,
	isLoading: false,
	isInitialized: false
});

const initMediaGalleryRoom = (draft: RootStore, roomId: string): MediaGalleryRoomState => {
	if (!draft.mediaGallery[roomId]) {
		draft.mediaGallery[roomId] = {
			buckets: {},
			activeFilter: DEFAULT_MEDIA_GALLERY_FILTER
		};
	}
	return draft.mediaGallery[roomId];
};

const ensureBucket = (
	draft: RootStore,
	roomId: string,
	filter: MediaGalleryFilter
): MediaGalleryBucket => {
	const state = initMediaGalleryRoom(draft, roomId);
	const key = getMediaGalleryBucketKey(filter);
	if (!state.buckets[key]) {
		state.buckets[key] = emptyBucket(filter);
	}
	return state.buckets[key];
};

const removeFromBucket = (bucket: MediaGalleryBucket, attachmentId: string): void => {
	const index = bucket.attachments.findIndex((a) => a.id === attachmentId);
	if (index === -1) return;
	bucket.attachments.splice(index, 1);
	if (bucket.total !== undefined && bucket.total > 0) bucket.total -= 1;
};

const prependToBucket = (bucket: MediaGalleryBucket, attachment: Attachment): void => {
	if (!bucket.isInitialized) return;
	// A new attachment is the most recent one: its position is only known
	// for buckets sorted by descending creation date.
	if (bucket.filter.sortBy !== 'created_at' || bucket.filter.order !== 'desc') return;
	if (!attachmentMatchesFilter(attachment, bucket.filter)) return;
	if (bucket.attachments.some((a) => a.id === attachment.id)) return;
	bucket.attachments.unshift(attachment);
	if (bucket.total !== undefined) bucket.total += 1;
};

export const useMediaGalleryStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	MediaGalleryStoreSlice
> = (set) => ({
	mediaGallery: {},
	setMediaGalleryLoading: (
		roomId: string,
		filter: MediaGalleryFilter,
		isLoading: boolean
	): void => {
		set(
			produce((draft: RootStore) => {
				const bucket = ensureBucket(draft, roomId, filter);
				if (bucket.isLoading === isLoading) return;
				bucket.isLoading = isLoading;
			}),
			false,
			'MG/SET_LOADING'
		);
	},
	appendMediaGalleryPage: (
		roomId: string,
		filter: MediaGalleryFilter,
		attachments: Array<Attachment>,
		total: number | undefined,
		nextCursor: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				const bucket = ensureBucket(draft, roomId, filter);
				bucket.attachments.push(...attachments);
				if (total !== undefined) bucket.total = total;
				bucket.nextCursor = nextCursor;
				bucket.hasMore = nextCursor !== undefined;
				bucket.isInitialized = true;
				bucket.isLoading = false;
			}),
			false,
			'MG/APPEND_PAGE'
		);
	},
	setMediaGalleryActiveFilter: (roomId: string, activeFilter: MediaGalleryActiveFilter): void => {
		set(
			produce((draft: RootStore) => {
				const state = initMediaGalleryRoom(draft, roomId);
				if (getMediaGalleryBucketKey(state.activeFilter) === getMediaGalleryBucketKey(activeFilter))
					return;
				// Buckets are independent caches keyed by filter combination, so the
				// previously fetched ones stay valid and don't need any reset.
				state.activeFilter = activeFilter;
			}),
			false,
			'MG/SET_ACTIVE_FILTER'
		);
	},
	removeMediaGalleryAttachment: (roomId: string, attachmentId: string): void => {
		set(
			produce((draft: RootStore) => {
				const state = draft.mediaGallery[roomId];
				if (!state) return;
				Object.values(state.buckets).forEach((bucket) => removeFromBucket(bucket, attachmentId));
			}),
			false,
			'MG/REMOVE_ATTACHMENT'
		);
	},
	prependMediaGalleryAttachment: (roomId: string, attachment: Attachment): void => {
		set(
			produce((draft: RootStore) => {
				const state = draft.mediaGallery[roomId];
				if (!state) return;
				Object.values(state.buckets).forEach((bucket) => prependToBucket(bucket, attachment));
			}),
			false,
			'MG/PREPEND_ATTACHMENT'
		);
	}
});
