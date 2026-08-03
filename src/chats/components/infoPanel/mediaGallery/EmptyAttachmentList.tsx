/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

type EmptyAttachmentListProps = {
	category: MimeTypeCategory;
};

export const EmptyAttachmentList: FC<EmptyAttachmentListProps> = ({ category }) => {
	const [t] = useTranslation();
	const titleByCategory: { [key in MimeTypeCategory]: string } = {
		IMAGES: t('mediaGallery.emptyState.titleImages', 'No images in this list'),
		VIDEOS: t('mediaGallery.emptyState.titleVideos', 'No videos in this list'),
		DOCUMENTS: t('mediaGallery.emptyState.titleDocuments', 'No documents in this list')
	};
	const descriptionLabel = t(
		'mediaGallery.emptyState.description',
		'Photos, videos and files will appear here when shared'
	);

	return (
		<Container
			data-testid="mediaGalleryEmptyState"
			mainAlignment="center"
			crossAlignment="center"
			padding={{ all: 'large' }}
		>
			<Text size="medium" color="secondary" weight="bold" overflow="break-word">
				{titleByCategory[category]}
			</Text>
			<Padding top="extrasmall">
				<Text size="small" color="secondary" textAlign="center" overflow="break-word">
					{descriptionLabel}
				</Text>
			</Padding>
		</Container>
	);
};
