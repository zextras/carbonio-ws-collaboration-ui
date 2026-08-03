/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment, GetRoomAttachmentsParams } from '../network/models/attachmentTypes';

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type MediaGalleryFilter = DistributiveOmit<GetRoomAttachmentsParams, 'limit' | 'cursor'>;

export type MediaGalleryActiveFilter = Omit<MediaGalleryFilter, 'mimeType' | 'mimeTypeCategory'>;

export type MediaGalleryBucket = {
	filter: MediaGalleryFilter;
	attachments: Array<Attachment>;
	total?: number;
	nextCursor?: string;
	hasMore: boolean;
	isLoading: boolean;
	isInitialized: boolean;
};

export type MediaGalleryRoomState = {
	buckets: { [filterKey: string]: MediaGalleryBucket };
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
