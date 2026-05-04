/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../../types/network/models/attachmentTypes';
import {
	DEFAULT_MEDIA_GALLERY_FILTER,
	MediaGalleryFilter
} from '../../types/store/MediaGalleryTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMediaGalleryAttachments = (store: RootStore, roomId: string): Array<Attachment> =>
	store.mediaGallery[roomId]?.attachments ?? [];

export const getMediaGalleryHasMore = (store: RootStore, roomId: string): boolean =>
	store.mediaGallery[roomId]?.hasMore ?? true;

export const getMediaGalleryIsLoading = (store: RootStore, roomId: string): boolean =>
	store.mediaGallery[roomId]?.isLoading ?? false;

export const getMediaGalleryIsInitialized = (store: RootStore, roomId: string): boolean =>
	store.mediaGallery[roomId]?.isInitialized ?? false;

export const getMediaGalleryFilter = (store: RootStore, roomId: string): MediaGalleryFilter =>
	store.mediaGallery[roomId]?.filter ?? DEFAULT_MEDIA_GALLERY_FILTER;
