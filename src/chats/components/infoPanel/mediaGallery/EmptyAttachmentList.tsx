/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

export const EmptyAttachmentList: FC = () => {
	const [t] = useTranslation();
	const titleLabel = t('mediaGallery.emptyState.title', 'No attachments in this list');
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
				{titleLabel}
			</Text>
			<Padding top="extrasmall">
				<Text size="small" color="secondary" textAlign="center" overflow="break-word">
					{descriptionLabel}
				</Text>
			</Padding>
		</Container>
	);
};
