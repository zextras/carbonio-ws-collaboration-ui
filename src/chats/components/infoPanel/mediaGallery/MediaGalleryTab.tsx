/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { AttachmentFilterTabs } from './AttachmentFilterTabs';
import { AttachmentList } from './AttachmentList';
import { AttachmentListSkeleton } from './AttachmentListSkeleton';
import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import { EmptyAttachmentList } from './EmptyAttachmentList';
import { useGalleryPreview } from '../../../../hooks/useGalleryPreview';
import { useMediaGalleryAttachments } from '../../../../hooks/useMediaGalleryAttachments';
import { getMediaGalleryFilter } from '../../../../store/selectors/MediaGallerySelectors';
import useStore from '../../../../store/Store';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = ({ roomId }) => {
	const { attachments, isInitialized, isLoading, hasMore, loadMore } =
		useMediaGalleryAttachments(roomId);
	const filterUserId = useStore((store) => getMediaGalleryFilter(store, roomId).userId);

	const filteredAttachments = useMemo(
		() => (filterUserId ? attachments.filter((a) => a.userId === filterUserId) : attachments),
		[attachments, filterUserId]
	);

	const { onPreviewClick, pendingDelete, confirmPendingDelete, cancelPendingDelete } =
		useGalleryPreview(roomId);

	const showInitialSkeleton = !isInitialized && isLoading;
	const showEmptyState = isInitialized && filteredAttachments.length === 0;

	return (
		<Container
			data-testid="mediaGalleryTab"
			mainAlignment="flex-start"
			crossAlignment="stretch"
			height="100%"
			minHeight={0}
		>
			<AttachmentFilterTabs roomId={roomId} />
			<Container mainAlignment="flex-start" crossAlignment="stretch" minHeight={0}>
				{showInitialSkeleton && <AttachmentListSkeleton />}
				{showEmptyState && <EmptyAttachmentList />}
				{!showInitialSkeleton && !showEmptyState && (
					<AttachmentList
						attachments={filteredAttachments}
						hasMore={hasMore}
						isLoading={isLoading}
						loadMore={loadMore}
						onPreviewClick={onPreviewClick}
					/>
				)}
			</Container>
			{pendingDelete && (
				<DeleteAttachmentModal
					open
					onConfirm={confirmPendingDelete}
					onClose={cancelPendingDelete}
				/>
			)}
		</Container>
	);
};
