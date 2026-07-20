/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { AttachmentList } from './AttachmentList';
import { AttachmentListSkeleton } from './AttachmentListSkeleton';
import { CategoryTabs } from './CategoryTabs';
import { EmptyAttachmentList } from './EmptyAttachmentList';
import { SentByFilterButton } from './SentByFilterButton';
import { useMediaGalleryAttachments } from '../../../../hooks/useMediaGalleryAttachments';
import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = ({ roomId }) => {
	const [category, setCategory] = useState<MimeTypeCategory>('IMAGES');
	const { attachments, isInitialized, isLoading, hasMore, loadMore, filterKey } =
		useMediaGalleryAttachments(roomId, category);

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
			<Container
				orientation="horizontal"
				padding={{ top: 'large', bottom: 'medium', horizontal: '2rem' }}
				height="fit"
				flexShrink={0}
				gap="0.5rem"
			>
				<CategoryTabs category={category} onCategoryChange={setCategory} />
				<SentByFilterButton roomId={roomId} />
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="stretch" minHeight={0}>
				{showInitialSkeleton && <AttachmentListSkeleton />}
				{showEmptyState && <EmptyAttachmentList />}
				{!showInitialSkeleton && !showEmptyState && (
					<AttachmentList
						key={filterKey}
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
