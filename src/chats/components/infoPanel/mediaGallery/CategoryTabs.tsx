/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, DefaultTabBarItemProps, TabBar, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MimeTypeCategory } from '../../../../types/network/models/attachmentTypes';

type SegmentPosition = 'left' | 'middle' | 'right';

const SEGMENT_RADIUS: { [position in SegmentPosition]: string } = {
	left: '0.25rem 0 0 0.25rem',
	middle: '0',
	right: '0 0.25rem 0.25rem 0'
};

const CATEGORY_BY_TAB_ID: { [id: string]: MimeTypeCategory } = {
	images: 'IMAGES',
	videos: 'VIDEOS',
	docs: 'DOCUMENTS'
};

const TAB_ID_BY_CATEGORY: { [category in MimeTypeCategory]: string } = {
	IMAGES: 'images',
	VIDEOS: 'videos',
	DOCUMENTS: 'docs'
};

const SegmentedItem = styled(Container)<{
	$selected: boolean;
	$position: SegmentPosition;
}>`
	cursor: pointer;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.primary.regular};
	border-radius: ${({ $position }): string => SEGMENT_RADIUS[$position]};
	background-color: ${({ theme, $selected }): string =>
		$selected ? theme.palette.primary.regular : theme.palette.gray6.regular};
	transition: background-color 150ms ease;
	-webkit-user-select: none;
	user-select: none;
	&:hover {
		background-color: ${({ theme, $selected }): string =>
			$selected ? theme.palette.primary.hover : `${theme.palette.primary.regular}14`};
	}
`;

type SegmentedTabItemProps = DefaultTabBarItemProps & React.HTMLAttributes<HTMLDivElement>;

const SegmentedTabItemBody: FC<SegmentedTabItemProps & { position: SegmentPosition }> = ({
	item,
	selected,
	onClick,
	position
}) => (
	<SegmentedItem
		data-testid={`mediaGalleryCategory-${item.id}`}
		$selected={selected}
		$position={position}
		onClick={onClick}
		padding={{ all: 'extrasmall' }}
		mainAlignment="center"
		crossAlignment="center"
		height="fit"
		minWidth={0}
		role="tab"
		aria-selected={selected}
	>
		<Text size="small" weight="regular" color={selected ? 'gray6' : 'primary'} overflow="ellipsis">
			{item.label}
		</Text>
	</SegmentedItem>
);

const LeftSegmentedTabItem: FC<SegmentedTabItemProps> = (props) => (
	<SegmentedTabItemBody {...props} position="left" />
);

const MiddleSegmentedTabItem: FC<SegmentedTabItemProps> = (props) => (
	<SegmentedTabItemBody {...props} position="middle" />
);

const RightSegmentedTabItem: FC<SegmentedTabItemProps> = (props) => (
	<SegmentedTabItemBody {...props} position="right" />
);

type CategoryTabsProps = {
	category: MimeTypeCategory;
	onCategoryChange: (category: MimeTypeCategory) => void;
};

export const CategoryTabs: FC<CategoryTabsProps> = ({ category, onCategoryChange }) => {
	const [t] = useTranslation();
	const imagesLabel = t('mediaGallery.tabs.images', 'Images');
	const videosLabel = t('mediaGallery.tabs.videos', 'Videos');
	const docsLabel = t('mediaGallery.tabs.docs', 'Docs');

	const items = useMemo(
		() => [
			{ id: 'images', label: imagesLabel, CustomComponent: LeftSegmentedTabItem },
			{ id: 'videos', label: videosLabel, CustomComponent: MiddleSegmentedTabItem },
			{ id: 'docs', label: docsLabel, CustomComponent: RightSegmentedTabItem }
		],
		[imagesLabel, videosLabel, docsLabel]
	);

	const handleChange = useCallback(
		(_ev: React.MouseEvent<HTMLDivElement> | KeyboardEvent, id: string) => {
			const nextCategory = CATEGORY_BY_TAB_ID[id];
			if (!nextCategory || nextCategory === category) return;
			onCategoryChange(nextCategory);
		},
		[category, onCategoryChange]
	);

	return (
		<Container data-testid="mediaGalleryCategoryTabs" height="fit" minWidth={0}>
			<TabBar
				items={items}
				selected={TAB_ID_BY_CATEGORY[category]}
				onChange={handleChange}
				background="transparent"
				underlineColor="transparent"
				forceWidthEquallyDistributed
				gap="0"
				height="fit"
				minHeight="0"
			/>
		</Container>
	);
};
