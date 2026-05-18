/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Attachment,
	AttachmentsSortBy,
	AttachmentsSortOrder
} from '../network/models/attachmentTypes';

export type MediaGalleryFilter = {
	userId?: string;
	sortBy: AttachmentsSortBy;
	order: AttachmentsSortOrder;
};

export type MediaGalleryRoomState = {
	attachments: Array<Attachment>;
	nextCursor?: string;
	hasMore: boolean;
	isLoading: boolean;
	isInitialized: boolean;
	filter: MediaGalleryFilter;
};

export type MediaGalleryMap = { [roomId: string]: MediaGalleryRoomState };

export const DEFAULT_MEDIA_GALLERY_FILTER: MediaGalleryFilter = {
	sortBy: 'created_at',
	order: 'desc'
};

export type MediaGalleryStoreSlice = {
	mediaGallery: MediaGalleryMap;
	setMediaGalleryLoading: (roomId: string, isLoading: boolean) => void;
	appendMediaGalleryPage: (
		roomId: string,
		attachments: Array<Attachment>,
		nextCursor: string | undefined
	) => void;
	setMediaGalleryFilter: (roomId: string, filter: MediaGalleryFilter) => void;
	removeMediaGalleryAttachment: (roomId: string, attachmentId: string) => void;
	prependMediaGalleryAttachment: (roomId: string, attachment: Attachment) => void;
};
