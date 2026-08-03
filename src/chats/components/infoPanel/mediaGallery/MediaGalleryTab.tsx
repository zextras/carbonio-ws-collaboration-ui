/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useState } from 'react';

import styled from '@emotion/styled';
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

const CancelButton = styled(Button)`
	> div {
		text-transform: none;
		font-size: ${({ theme }): string => theme.sizes.font.small};
	}
`;

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

	useEffect(() => {
		clearSelection();
	}, [filterKey, clearSelection]);

	useEffect(() => {
		pruneSelection(attachments);
	}, [attachments, pruneSelection]);

	const showInitialSkeleton = !isInitialized && isLoading;
	const showEmptyState = isInitialized && attachments.length === 0;
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
					padding={{ top: 'large', bottom: 'medium', horizontal: 'large' }}
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
						padding={{ horizontal: 'large', bottom: 'extrasmall' }}
						height="fit"
						flexShrink={0}
					>
						<Text size="small" color="secondary">
							{selectedCountLabel}
						</Text>
						<CancelButton
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
