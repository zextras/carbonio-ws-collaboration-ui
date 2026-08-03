/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	Padding,
	Radio,
	Text
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getMediaGalleryActiveFilter } from '../../../../store/selectors/MediaGallerySelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';

const FilterButtonContainer = styled(Container)`
	position: relative;
`;

const ActiveFilterDot = styled.div`
	position: absolute;
	width: 0.313rem;
	height: 0.313rem;
	background-color: ${({ theme }): string => theme.palette.primary.regular};
	border: 0.0625rem solid ${({ theme }): string => theme.palette.primary.regular};
	border-radius: 50%;
	top: 0.25rem;
	right: 0.25rem;
`;

type SentByFilterButtonProps = {
	roomId: string;
};

export const SentByFilterButton: FC<SentByFilterButtonProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const sentByLabel = t('mediaGallery.filter.sentBy', 'Sent by:');
	const allLabel = t('mediaGallery.filter.sentByAll', 'All');
	const youLabel = t('mediaGallery.filter.sentByYou', 'You');
	const filterTooltip = t('mediaGallery.filter.tooltip', 'Filter the gallery');

	const filterUserId = useStore((store) => getMediaGalleryActiveFilter(store, roomId).userId);
	const currentUserId = useStore(getUserId);
	const setMediaGalleryActiveFilter = useStore((store) => store.setMediaGalleryActiveFilter);

	const setSentBy = useCallback(
		(userId: string | undefined): void => {
			const currentFilter = getMediaGalleryActiveFilter(useStore.getState(), roomId);
			if (currentFilter.userId === userId) return;
			setMediaGalleryActiveFilter(roomId, { ...currentFilter, userId });
		},
		[roomId, setMediaGalleryActiveFilter]
	);

	const items: Array<DropdownItem> = useMemo(
		() => [
			{
				id: 'sent-by-title',
				disabled: true,
				customComponent: (
					<Padding vertical="extrasmall">
						<Text size="small" weight="bold">
							{sentByLabel}
						</Text>
					</Padding>
				)
			},
			{
				id: 'sent-by-all',
				onClick: (): void => setSentBy(undefined),
				customComponent: (
					<Container
						data-testid="mediaGallerySentBy-all"
						orientation="horizontal"
						mainAlignment="flex-start"
						width="fill"
					>
						<Radio
							size="small"
							checked={filterUserId === undefined}
							label={allLabel}
							value="all"
							onChange={(): void => setSentBy(undefined)}
						/>
					</Container>
				)
			},
			{
				id: 'sent-by-you',
				disabled: !currentUserId,
				onClick: (): void => setSentBy(currentUserId),
				customComponent: (
					<Container
						data-testid="mediaGallerySentBy-you"
						orientation="horizontal"
						mainAlignment="flex-start"
						width="fill"
					>
						<Radio
							size="small"
							checked={filterUserId !== undefined && filterUserId === currentUserId}
							label={youLabel}
							value="you"
							onChange={(): void => setSentBy(currentUserId)}
						/>
					</Container>
				)
			}
		],
		[allLabel, currentUserId, filterUserId, sentByLabel, setSentBy, youLabel]
	);

	return (
		<Dropdown items={items} placement="bottom-end">
			<FilterButtonContainer width="fit" height="fit">
				<Button
					icon="Options2Outline"
					type="ghost"
					color="text"
					size="large"
					title={filterTooltip}
					onClick={(): null => null}
					data-testid="mediaGallerySentByFilterButton"
				/>
				{filterUserId !== undefined && (
					<ActiveFilterDot data-testid="mediaGallerySentByActiveDot" />
				)}
			</FilterButtonContainer>
		</Dropdown>
	);
};
