/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { MEDIA_GALLERY_PAGE_SIZE } from './useMediaGalleryAttachments';
import { getRoomAttachments } from '../network';
import { getMediaGalleryAttachments } from '../store/selectors/MediaGallerySelectors';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';

export type UseChatAttachmentsForPreviewResult = {
	attachments: Array<Attachment>;
	isInitialized: boolean;
	isLoading: boolean;
	hasMore: boolean;
	loadMore: () => void;
	ensureAttachmentLoaded: (attachmentId: string) => Promise<boolean>;
};

export const useChatAttachmentsForPreview = (
	roomId: string
): UseChatAttachmentsForPreviewResult => {
	const galleryAttachments = useStore((store) => getMediaGalleryAttachments(store, roomId));
	const isInitialized = useStore((store) => store.mediaGallery[roomId]?.isInitialized ?? false);
	const isLoading = useStore((store) => store.mediaGallery[roomId]?.isLoading ?? false);
	const hasMore = useStore((store) => store.mediaGallery[roomId]?.hasMore ?? true);
	const setMediaGalleryLoading = useStore((store) => store.setMediaGalleryLoading);
	const appendMediaGalleryPage = useStore((store) => store.appendMediaGalleryPage);

	// Chat displays attachments in message order: older → newer.
	// The gallery store holds them newest → oldest, so reverse for preview navigation.
	const attachments = useMemo(() => [...galleryAttachments].reverse(), [galleryAttachments]);

	const fetchPage = useCallback(
		async (cursor: string | undefined): Promise<void> => {
			const state = useStore.getState().mediaGallery[roomId];
			if (state?.isLoading) return;
			setMediaGalleryLoading(roomId, true);
			try {
				const response = await getRoomAttachments(roomId, {
					limit: MEDIA_GALLERY_PAGE_SIZE,
					cursor,
					sortBy: 'created_at',
					order: 'desc'
				});
				appendMediaGalleryPage(roomId, response.attachments, response.cursor);
			} catch {
				setMediaGalleryLoading(roomId, false);
			}
		},
		[roomId, setMediaGalleryLoading, appendMediaGalleryPage]
	);

	const loadMore = useCallback((): void => {
		const state = useStore.getState().mediaGallery[roomId];
		if (!state || state.isLoading || !state.hasMore) return;
		fetchPage(state.nextCursor);
	}, [roomId, fetchPage]);

	const ensureAttachmentLoaded = useCallback(
		async (attachmentId: string): Promise<boolean> => {
			const hasAttachment = (): boolean => {
				const state = useStore.getState().mediaGallery[roomId];
				return state?.attachments.some((a) => a.id === attachmentId) ?? false;
			};
			const getNextCursor = (): { canFetch: boolean; cursor: string | undefined } => {
				const state = useStore.getState().mediaGallery[roomId];
				if (!state) return { canFetch: true, cursor: undefined };
				if (!state.isInitialized) return { canFetch: true, cursor: undefined };
				if (!state.hasMore) return { canFetch: false, cursor: undefined };
				return { canFetch: true, cursor: state.nextCursor };
			};

			let { canFetch, cursor } = getNextCursor();
			while (canFetch && !hasAttachment()) {
				// eslint-disable-next-line no-await-in-loop
				await fetchPage(cursor);
				if (hasAttachment()) return true;
				({ canFetch, cursor } = getNextCursor());
			}

			return hasAttachment();
		},
		[roomId, fetchPage]
	);

	return { attachments, isInitialized, isLoading, hasMore, loadMore, ensureAttachmentLoaded };
};

export default useChatAttachmentsForPreview;
