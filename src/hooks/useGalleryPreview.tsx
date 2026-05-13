/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import {
	useAttachmentPreviewController,
	UseAttachmentPreviewControllerResult
} from './useAttachmentPreviewController';
import { useMediaGalleryAttachments } from './useMediaGalleryAttachments';
import { getMediaGalleryFilter } from '../store/selectors/MediaGallerySelectors';
import useStore from '../store/Store';

export type UseGalleryPreviewHook = UseAttachmentPreviewControllerResult;

export const useGalleryPreview = (roomId: string): UseGalleryPreviewHook => {
	const { attachments, hasMore, isLoading, loadMore } = useMediaGalleryAttachments(roomId);
	const filterUserId = useStore((store) => getMediaGalleryFilter(store, roomId).userId);
	const filteredAttachments = useMemo(
		() => (filterUserId ? attachments.filter((a) => a.userId === filterUserId) : attachments),
		[attachments, filterUserId]
	);
	const onAttachmentRemoved = useStore((store) => store.removeMediaGalleryAttachment);
	return useAttachmentPreviewController({
		source: { attachments: filteredAttachments, hasMore, isLoading, loadMore },
		onAttachmentRemoved
	});
};

export default useGalleryPreview;
