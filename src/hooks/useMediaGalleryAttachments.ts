/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect } from 'react';

import { getRoomAttachments } from '../network';
import {
	getMediaGalleryAttachments,
	getMediaGalleryHasMore,
	getMediaGalleryIsInitialized,
	getMediaGalleryIsLoading
} from '../store/selectors/MediaGallerySelectors';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';
import { DEFAULT_MEDIA_GALLERY_FILTER } from '../types/store/MediaGalleryTypes';

export const MEDIA_GALLERY_PAGE_SIZE = 20;

type UseMediaGalleryAttachmentsResult = {
	attachments: Array<Attachment>;
	isInitialized: boolean;
	isLoading: boolean;
	hasMore: boolean;
	loadMore: () => void;
};

export const useMediaGalleryAttachments = (roomId: string): UseMediaGalleryAttachmentsResult => {
	const attachments = useStore((store) => getMediaGalleryAttachments(store, roomId));
	const isInitialized = useStore((store) => getMediaGalleryIsInitialized(store, roomId));
	const isLoading = useStore((store) => getMediaGalleryIsLoading(store, roomId));
	const hasMore = useStore((store) => getMediaGalleryHasMore(store, roomId));
	const setMediaGalleryLoading = useStore((store) => store.setMediaGalleryLoading);
	const appendMediaGalleryPage = useStore((store) => store.appendMediaGalleryPage);

	const fetchPage = useCallback(
		(cursor: string | undefined): void => {
			const state = useStore.getState().mediaGallery[roomId];
			if (state?.isLoading) return;
			const filter = state?.filter ?? DEFAULT_MEDIA_GALLERY_FILTER;
			setMediaGalleryLoading(roomId, true);
			getRoomAttachments(roomId, {
				limit: MEDIA_GALLERY_PAGE_SIZE,
				cursor,
				userId: filter.userId,
				sortBy: filter.sortBy,
				order: filter.order
			})
				.then((response) => {
					appendMediaGalleryPage(roomId, response.attachments, response.cursor);
				})
				.catch((error) => {
					console.error('Failed to fetch room attachments', error);
					setMediaGalleryLoading(roomId, false);
				});
		},
		[roomId, setMediaGalleryLoading, appendMediaGalleryPage]
	);

	useEffect(() => {
		const state = useStore.getState().mediaGallery[roomId];
		if (!state?.isInitialized && !state?.isLoading) {
			fetchPage(undefined);
		}
	}, [roomId, isInitialized, fetchPage]);

	const loadMore = useCallback(() => {
		const state = useStore.getState().mediaGallery[roomId];
		if (!state || state.isLoading || !state.hasMore) return;
		fetchPage(state.nextCursor);
	}, [roomId, fetchPage]);

	return { attachments, isInitialized, isLoading, hasMore, loadMore };
};
