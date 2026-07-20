/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryActiveFilter
} from '../../types/store/MediaGalleryTypes';
import { RootStore } from '../../types/store/StoreTypes';

// Stable fallback so subscriptions don't re-render while the bucket doesn't exist yet.
const NO_ATTACHMENTS: Array<Attachment> = [];

export const getMediaGalleryAttachments = (
	store: RootStore,
	roomId: string,
	filterKey: string
): Array<Attachment> =>
	store.mediaGallery[roomId]?.buckets[filterKey]?.attachments ?? NO_ATTACHMENTS;

export const getMediaGalleryHasMore = (
	store: RootStore,
	roomId: string,
	filterKey: string
): boolean => store.mediaGallery[roomId]?.buckets[filterKey]?.hasMore ?? true;

export const getMediaGalleryIsLoading = (
	store: RootStore,
	roomId: string,
	filterKey: string
): boolean => store.mediaGallery[roomId]?.buckets[filterKey]?.isLoading ?? false;

export const getMediaGalleryIsInitialized = (
	store: RootStore,
	roomId: string,
	filterKey: string
): boolean => store.mediaGallery[roomId]?.buckets[filterKey]?.isInitialized ?? false;

export const getMediaGalleryTotal = (
	store: RootStore,
	roomId: string,
	filterKey: string
): number | undefined => store.mediaGallery[roomId]?.buckets[filterKey]?.total;

export const getMediaGalleryActiveFilter = (
	store: RootStore,
	roomId: string
): MediaGalleryActiveFilter =>
	store.mediaGallery[roomId]?.activeFilter ?? DEFAULT_MEDIA_GALLERY_FILTER;
