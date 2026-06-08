/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, DefaultTabBarItemProps, TabBar, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getMediaGalleryFilter } from '../../../../store/selectors/MediaGallerySelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';

const FILTER_ALL = 'all';
const FILTER_MINE = 'mine';

const SegmentedItem = styled(Container)<{
	$selected: boolean;
	$disabled: boolean;
	$position: 'left' | 'right';
}>`
	cursor: ${({ $disabled }): string => ($disabled ? 'not-allowed' : 'pointer')};
	border: 0.0625rem solid
		${({ theme, $disabled }): string =>
			$disabled ? theme.palette.primary.disabled : theme.palette.primary.regular};
	border-radius: ${({ $position }): string =>
		$position === 'left' ? '0.25rem 0 0 0.25rem' : '0 0.25rem 0.25rem 0'};
	background-color: ${({ theme, $selected, $disabled }): string => {
		if (!$selected) return theme.palette.gray6.regular;
		return $disabled ? theme.palette.primary.disabled : theme.palette.primary.regular;
	}};
	transition: background-color 150ms ease;
	-webkit-user-select: none;
	user-select: none;
	&:hover {
		background-color: ${({ theme, $selected, $disabled }): string => {
			if ($disabled)
				return $selected ? theme.palette.primary.disabled : theme.palette.gray6.regular;
			return $selected ? theme.palette.primary.hover : `${theme.palette.primary.regular}14`;
		}};
	}
`;

type SegmentedTabItemProps = DefaultTabBarItemProps & React.HTMLAttributes<HTMLDivElement>;

const SegmentedTabItemBody: FC<SegmentedTabItemProps & { position: 'left' | 'right' }> = ({
	item,
	selected,
	onClick,
	position
}) => {
	const disabled = item.disabled ?? false;
	return (
		<SegmentedItem
			data-testid={`mediaGalleryFilter-${item.id}`}
			$selected={selected}
			$disabled={disabled}
			$position={position}
			onClick={disabled ? undefined : onClick}
			padding={{ all: 'extrasmall' }}
			mainAlignment="center"
			crossAlignment="center"
			height="fit"
			minWidth={0}
			role="tab"
			aria-selected={selected}
			aria-disabled={disabled}
		>
			<Text
				size="small"
				weight="regular"
				color={selected ? 'gray6' : 'primary'}
				overflow="ellipsis"
			>
				{item.label}
			</Text>
		</SegmentedItem>
	);
};

const LeftSegmentedTabItem: FC<SegmentedTabItemProps> = (props) => (
	<SegmentedTabItemBody {...props} position="left" />
);

const RightSegmentedTabItem: FC<SegmentedTabItemProps> = (props) => (
	<SegmentedTabItemBody {...props} position="right" />
);

type AttachmentFilterTabsProps = {
	roomId: string;
};

export const AttachmentFilterTabs: FC<AttachmentFilterTabsProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const allLabel = t('mediaGallery.filter.all', 'All attachments');
	const mineLabel = t('mediaGallery.filter.mine', 'My attachments');

	const filterUserId = useStore((store) => getMediaGalleryFilter(store, roomId).userId);
	const currentUserId = useStore(getUserId);
	const setMediaGalleryFilter = useStore((store) => store.setMediaGalleryFilter);

	const items = useMemo(
		() => [
			{ id: FILTER_ALL, label: allLabel, CustomComponent: LeftSegmentedTabItem },
			{
				id: FILTER_MINE,
				label: mineLabel,
				CustomComponent: RightSegmentedTabItem,
				disabled: !currentUserId
			}
		],
		[allLabel, mineLabel, currentUserId]
	);

	const selected = currentUserId && filterUserId === currentUserId ? FILTER_MINE : FILTER_ALL;

	const handleChange = useCallback(
		(_ev: React.MouseEvent<HTMLDivElement> | KeyboardEvent, id: string) => {
			if (id === selected) return;
			const nextUserId = id === FILTER_MINE ? currentUserId : undefined;
			const currentFilter = getMediaGalleryFilter(useStore.getState(), roomId);
			setMediaGalleryFilter(roomId, { ...currentFilter, userId: nextUserId });
		},
		[selected, currentUserId, setMediaGalleryFilter, roomId]
	);

	return (
		<Container
			data-testid="attachmentFilterTabs"
			orientation="horizontal"
			padding={{ top: 'large', bottom: 'medium', horizontal: '2rem' }}
			height="fit"
			flexShrink={0}
		>
			<TabBar
				items={items}
				selected={selected}
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
