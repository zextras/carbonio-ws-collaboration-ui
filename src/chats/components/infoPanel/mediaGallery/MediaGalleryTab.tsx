/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { AttachmentGrid } from './AttachmentGrid';
import { AttachmentList } from './AttachmentList';
import { AttachmentListSkeleton } from './AttachmentListSkeleton';
import { CategoryTabs } from './CategoryTabs';
import { EmptyAttachmentList } from './EmptyAttachmentList';
import { SentByFilterButton } from './SentByFilterButton';
import { TotalCounterChip } from './TotalCounterChip';
import { useMediaGalleryAttachments } from '../../../../hooks/useMediaGalleryAttachments';
import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = ({ roomId }) => {
	const [category, setCategory] = useState<MimeTypeCategory>('IMAGES');
	const { attachments, isInitialized, isLoading, hasMore, loadMore, total, filterKey } =
		useMediaGalleryAttachments(roomId, category);

	const showInitialSkeleton = !isInitialized && isLoading;
	const showEmptyState = isInitialized && attachments.length === 0;
	// Documents keep the detailed list; images and videos use the 4-column grid.
	const ContentComponent = category === 'DOCUMENTS' ? AttachmentList : AttachmentGrid;

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
			<Container
				mainAlignment="flex-start"
				crossAlignment="stretch"
				minHeight={0}
				style={{ position: 'relative' }}
			>
				{showInitialSkeleton && <AttachmentListSkeleton />}
				{showEmptyState && <EmptyAttachmentList category={category} />}
				{!showInitialSkeleton && !showEmptyState && (
					<ContentComponent
						key={filterKey}
						attachments={attachments}
						hasMore={hasMore}
						isLoading={isLoading}
						loadMore={loadMore}
					/>
				)}
				<TotalCounterChip total={total} category={category} />
			</Container>
		</Container>
	);
};
