/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo } from 'react';

import { getRoomAttachments } from '../network';
import {
	getMediaGalleryActiveFilter,
	getMediaGalleryAttachments,
	getMediaGalleryHasMore,
	getMediaGalleryIsInitialized,
	getMediaGalleryIsLoading,
	getMediaGalleryTotal
} from '../store/selectors/MediaGallerySelectors';
import useStore from '../store/Store';
import { Attachment, MimeTypeCategory } from '../types/network/models/attachmentTypes';
import { MediaGalleryActiveFilter } from '../types/store/MediaGalleryTypes';
import { getMediaGalleryBucketKey } from '../utils/attachmentUtils';

export const MEDIA_GALLERY_PAGE_SIZE = 50;

type UseMediaGalleryAttachmentsResult = {
	attachments: Array<Attachment>;
	isInitialized: boolean;
	isLoading: boolean;
	hasMore: boolean;
	total: number | undefined;
	loadMore: () => void;
	activeFilter: MediaGalleryActiveFilter;
	setActiveFilter: (activeFilter: MediaGalleryActiveFilter) => void;
	filterKey: string;
};

export const useMediaGalleryAttachments = (
	roomId: string,
	category?: MimeTypeCategory
): UseMediaGalleryAttachmentsResult => {
	const activeFilter = useStore((store) => getMediaGalleryActiveFilter(store, roomId));

	const filter = useMemo(
		() => ({ ...activeFilter, mimeTypeCategory: category }),
		[activeFilter, category]
	);
	const filterKey = useMemo(() => getMediaGalleryBucketKey(filter), [filter]);

	const attachments = useStore((store) => getMediaGalleryAttachments(store, roomId, filterKey));
	const isInitialized = useStore((store) => getMediaGalleryIsInitialized(store, roomId, filterKey));
	const isLoading = useStore((store) => getMediaGalleryIsLoading(store, roomId, filterKey));
	const hasMore = useStore((store) => getMediaGalleryHasMore(store, roomId, filterKey));
	const total = useStore((store) => getMediaGalleryTotal(store, roomId, filterKey));
	const setMediaGalleryLoading = useStore((store) => store.setMediaGalleryLoading);
	const appendMediaGalleryPage = useStore((store) => store.appendMediaGalleryPage);
	const setMediaGalleryActiveFilter = useStore((store) => store.setMediaGalleryActiveFilter);

	const fetchPage = useCallback(
		(cursor: string | undefined): void => {
			const bucket = useStore.getState().mediaGallery[roomId]?.buckets[filterKey];
			if (bucket?.isLoading) return;
			setMediaGalleryLoading(roomId, filter, true);
			getRoomAttachments(roomId, { ...filter, limit: MEDIA_GALLERY_PAGE_SIZE, cursor })
				.then((response) => {
					appendMediaGalleryPage(
						roomId,
						filter,
						response.attachments,
						response.total,
						response.cursor
					);
				})
				.catch((error) => {
					console.error('Failed to fetch room attachments', error);
					setMediaGalleryLoading(roomId, filter, false);
				});
		},
		[roomId, filter, filterKey, setMediaGalleryLoading, appendMediaGalleryPage]
	);

	useEffect(() => {
		const bucket = useStore.getState().mediaGallery[roomId]?.buckets[filterKey];
		if (!bucket?.isInitialized && !bucket?.isLoading) {
			fetchPage(undefined);
		}
	}, [roomId, filterKey, isInitialized, fetchPage]);

	const loadMore = useCallback(() => {
		const bucket = useStore.getState().mediaGallery[roomId]?.buckets[filterKey];
		if (!bucket || bucket.isLoading || !bucket.hasMore) return;
		fetchPage(bucket.nextCursor);
	}, [roomId, filterKey, fetchPage]);

	const setActiveFilter = useCallback(
		(newFilter: MediaGalleryActiveFilter): void => {
			setMediaGalleryActiveFilter(roomId, newFilter);
		},
		[roomId, setMediaGalleryActiveFilter]
	);

	return {
		attachments,
		isInitialized,
		isLoading,
		hasMore,
		total,
		loadMore,
		activeFilter,
		setActiveFilter,
		filterKey
	};
};
