/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

const ChipContainer = styled.div`
	position: absolute;
	bottom: 0.75rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 2;
	padding: 0.25rem 0.75rem;
	border-radius: 1rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
	white-space: nowrap;
	pointer-events: none;
`;

type TotalCounterChipProps = {
	total: number | undefined;
	category: MimeTypeCategory;
};

export const TotalCounterChip: FC<TotalCounterChipProps> = ({ total, category }) => {
	const [t] = useTranslation();

	if (total === undefined || total === 0) return null;

	const labelByCategory: { [key in MimeTypeCategory]: string } = {
		IMAGES: t('mediaGallery.count.images', {
			count: total,
			defaultValue_one: '{{count}} image',
			defaultValue_other: '{{count}} images'
		}),
		VIDEOS: t('mediaGallery.count.videos', {
			count: total,
			defaultValue_one: '{{count}} video',
			defaultValue_other: '{{count}} videos'
		}),
		DOCUMENTS: t('mediaGallery.count.documents', {
			count: total,
			defaultValue_one: '{{count}} document',
			defaultValue_other: '{{count}} documents'
		})
	};

	return (
		<ChipContainer data-testid="mediaGalleryTotalCounter">
			<Text size="small">{labelByCategory[category]}</Text>
		</ChipContainer>
	);
};
