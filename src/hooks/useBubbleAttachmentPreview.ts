/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import {
	useAttachmentPreviewController,
	UseAttachmentPreviewControllerResult
} from './useAttachmentPreviewController';
import { useChatAttachmentsForPreview } from './useChatAttachmentsForPreview';
import useStore from '../store/Store';
import { Attachment } from '../types/network/models/attachmentTypes';

export type UseBubbleAttachmentPreviewResult = Omit<
	UseAttachmentPreviewControllerResult,
	'onPreviewClick'
> & {
	onPreviewClick: (attachmentId: string) => Promise<void>;
};

export const useBubbleAttachmentPreview = (roomId: string): UseBubbleAttachmentPreviewResult => {
	const { attachments, hasMore, isLoading, loadMore, ensureAttachmentLoaded } =
		useChatAttachmentsForPreview(roomId);
	const onAttachmentRemoved = useStore((store) => store.removeMediaGalleryAttachment);

	const controller = useAttachmentPreviewController({
		source: { attachments, hasMore, isLoading, loadMore, prefetchAt: 'start' },
		onAttachmentRemoved
	});

	const onPreviewClick = useCallback(
		async (attachmentId: string): Promise<void> => {
			const found = await ensureAttachmentLoaded(attachmentId);
			if (!found) return;
			const attachment: Attachment | undefined = useStore
				.getState()
				.mediaGallery[roomId]?.attachments.find((a) => a.id === attachmentId);
			if (!attachment) return;
			controller.onPreviewClick(attachment);
		},
		[ensureAttachmentLoaded, roomId, controller]
	);

	return {
		onPreviewClick,
		closePreview: controller.closePreview,
		pendingDelete: controller.pendingDelete,
		confirmPendingDelete: controller.confirmPendingDelete,
		cancelPendingDelete: controller.cancelPendingDelete
	};
};

export default useBubbleAttachmentPreview;
