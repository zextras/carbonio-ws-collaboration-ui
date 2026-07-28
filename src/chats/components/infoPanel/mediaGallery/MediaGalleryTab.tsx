/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useState } from 'react';

import { Button, Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { AttachmentGrid } from './AttachmentGrid';
import { AttachmentList } from './AttachmentList';
import { AttachmentListSkeleton } from './AttachmentListSkeleton';
import { BulkActionsBar } from './BulkActionsBar';
import { CategoryTabs } from './CategoryTabs';
import { EmptyAttachmentList } from './EmptyAttachmentList';
import {
	MediaGallerySelectionContext,
	useMediaGallerySelectionState
} from './MediaGallerySelectionContext';
import { SentByFilterButton } from './SentByFilterButton';
import { TotalCounterChip } from './TotalCounterChip';
import { useMediaGalleryAttachments } from '../../../../hooks/useMediaGalleryAttachments';
import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

type MediaGalleryTabProps = {
	roomId: string;
};

export const MediaGalleryTab: FC<MediaGalleryTabProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const cancelLabel = t('action.cancel', 'Cancel');

	const [category, setCategory] = useState<MimeTypeCategory>('IMAGES');
	const { attachments, isInitialized, isLoading, hasMore, loadMore, total, filterKey } =
		useMediaGalleryAttachments(roomId, category);

	const selection = useMediaGallerySelectionState();
	const { isSelectionMode, selectedCount, clearSelection, pruneSelection } = selection;
	const selectedCountLabel = t('mediaGallery.selection.count', '{{count}} selected', {
		count: selectedCount
	});

	// Selection is scoped to the current bucket: reset it on tab/filter change...
	useEffect(() => {
		clearSelection();
	}, [filterKey, clearSelection]);

	// ...and drop items that left the list (e.g. deleted from another flow).
	useEffect(() => {
		pruneSelection(attachments);
	}, [attachments, pruneSelection]);

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
			<MediaGallerySelectionContext.Provider value={selection}>
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
				{isSelectionMode && (
					<Container
						data-testid="mediaGallerySelectionHeader"
						orientation="horizontal"
						mainAlignment="space-between"
						padding={{ horizontal: '2rem', bottom: 'extrasmall' }}
						height="fit"
						flexShrink={0}
					>
						<Text size="small" color="secondary">
							{selectedCountLabel}
						</Text>
						<Button
							data-testid="mediaGallerySelectionCancel"
							label={cancelLabel}
							type="ghost"
							color="primary"
							size="small"
							onClick={clearSelection}
						/>
					</Container>
				)}
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
					{isSelectionMode ? (
						<BulkActionsBar />
					) : (
						<TotalCounterChip total={total} category={category} />
					)}
				</Container>
			</MediaGallerySelectionContext.Provider>
		</Container>
	);
};
