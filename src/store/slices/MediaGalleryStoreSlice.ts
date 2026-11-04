/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseIsoMicros } from '@zextras/carbonio-ws-collaboration-ui-sdk';
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
import { getIsWscPure } from '../selectors/SessionSelectors';

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

const isNewerInGallery = (candidate: Attachment, other: Attachment): boolean => {
	const candidateTime = parseIsoMicros(candidate.createdAt);
	const otherTime = parseIsoMicros(other.createdAt);
	if (candidateTime !== otherTime) return candidateTime > otherTime;
	return candidate.id > other.id;
};

const prependToBucket = (
	bucket: MediaGalleryBucket,
	attachment: Attachment,
	isWscPure: boolean
): void => {
	if (!bucket.isInitialized) return;
	if (bucket.filter.sortBy !== 'created_at' || bucket.filter.order !== 'desc') return;
	if (!attachmentMatchesFilter(attachment, bucket.filter)) return;
	if (bucket.attachments.some((a) => a.id === attachment.id)) return;
	if (!isWscPure) {
		bucket.attachments.unshift(attachment);
		if (bucket.total !== undefined) bucket.total += 1;
		return;
	}
	const index = bucket.attachments.findIndex((a) => isNewerInGallery(attachment, a));
	// Older than everything loaded while pages remain: the next page brings it
	if (index !== -1 || !bucket.hasMore) {
		bucket.attachments.splice(index === -1 ? bucket.attachments.length : index, 0, attachment);
	}
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
				const known = new Set(bucket.attachments.map((a) => a.id));
				bucket.attachments.push(...attachments.filter((a) => !known.has(a.id)));
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
				const isWscPure = getIsWscPure(draft);
				Object.values(state.buckets).forEach((bucket) =>
					prependToBucket(bucket, attachment, isWscPure)
				);
			}),
			false,
			'MG/PREPEND_ATTACHMENT'
		);
	}
});
