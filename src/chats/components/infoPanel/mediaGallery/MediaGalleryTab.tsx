/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { AttachmentFilterTabs } from './AttachmentFilterTabs';
import { AttachmentList } from './AttachmentList';
import { AttachmentListSkeleton } from './AttachmentListSkeleton';
import { EmptyAttachmentList } from './EmptyAttachmentList';
import { useMediaGalleryAttachments } from '../../../../hooks/useMediaGalleryAttachments';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = ({ roomId }) => {
	const { attachments, isInitialized, isLoading, hasMore, loadMore } =
		useMediaGalleryAttachments(roomId);

	const showInitialSkeleton = !isInitialized && isLoading;
	const showEmptyState = isInitialized && attachments.length === 0;

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
						attachments={attachments}
						hasMore={hasMore}
						isLoading={isLoading}
						loadMore={loadMore}
					/>
				)}
			</Container>
		</Container>
	);
};
