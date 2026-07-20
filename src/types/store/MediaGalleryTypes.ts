/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment, GetRoomAttachmentsParams } from '../network/models/attachmentTypes';

// All the filter/sort params of the attachments API, without the pagination ones.
// Each distinct combination identifies an independent pagination bucket.
export type MediaGalleryFilter = Omit<GetRoomAttachmentsParams, 'limit' | 'cursor'>;

// The filter chosen by the user: the mime type category comes from the active tab,
// not from the filter itself.
export type MediaGalleryActiveFilter = Omit<MediaGalleryFilter, 'mimeType' | 'mimeTypeCategory'>;

export type MediaGalleryBucket = {
	// The params this bucket is fetched with (its key is derived from them).
	filter: MediaGalleryFilter;
	attachments: Array<Attachment>;
	total?: number;
	nextCursor?: string;
	hasMore: boolean;
	isLoading: boolean;
	isInitialized: boolean;
};

export type MediaGalleryRoomState = {
	// One independent pagination bucket per filter combination (key = serialized
	// filter), so changing filter or tab keeps the other buckets' lists and
	// cursors intact and switching back doesn't refetch.
	buckets: { [filterKey: string]: MediaGalleryBucket };
	// Filter selected by the user, shared across the category tabs.
	activeFilter: MediaGalleryActiveFilter;
};

export type MediaGalleryMap = { [roomId: string]: MediaGalleryRoomState };

export const DEFAULT_MEDIA_GALLERY_FILTER: MediaGalleryActiveFilter = {
	sortBy: 'created_at',
	order: 'desc'
};

export type MediaGalleryStoreSlice = {
	mediaGallery: MediaGalleryMap;
	setMediaGalleryLoading: (roomId: string, filter: MediaGalleryFilter, isLoading: boolean) => void;
	appendMediaGalleryPage: (
		roomId: string,
		filter: MediaGalleryFilter,
		attachments: Array<Attachment>,
		total: number | undefined,
		nextCursor: string | undefined
	) => void;
	setMediaGalleryActiveFilter: (roomId: string, activeFilter: MediaGalleryActiveFilter) => void;
	removeMediaGalleryAttachment: (roomId: string, attachmentId: string) => void;
	prependMediaGalleryAttachment: (roomId: string, attachment: Attachment) => void;
};
