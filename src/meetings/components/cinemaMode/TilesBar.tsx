/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useRef } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import usePagination from '../../../hooks/usePagination';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getVideoScreenIn } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../tile/Tile';

const TilesBarContainer = styled(Container)`
	padding: 3.25rem 1rem;
	position: relative;
`;

const TileContainer = styled(Container)`
	gap: 1rem;
`;

const ButtonUpContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	width: calc(100% - 1rem);
`;

const ButtonDownContainer = styled(Container)`
	position: absolute;
	bottom: 1rem;
	width: calc(100% - 1rem);
	z-index: 100;
`;

type TilesBarProps = {
	carouselTiles: TileData[];
	centralTile: TileData;
};

const TilesBar = ({ carouselTiles, centralTile }: TilesBarProps): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const scrollUpLabel = t('tooltip.scrollUp', 'Scroll up');
	const scrollDownLabel = t('tooltip.scrollDown', 'Scroll down');
	const topLabel = t('tooltip.topOfList', 'Top of list');
	const bottomLabel = t('tooltip.bottomOfList', 'Bottom of list');

	const videoScreenIn = useStore((store) => getVideoScreenIn(store, meetingId));
	const setUpdateSubscription = useStore((store) => store.setUpdateSubscription);

	const tilesContainerRef = useRef<HTMLDivElement>(null);

	const dimensions = useContainerDimensions(tilesContainerRef);

	const totalTiles = useMemo(() => size(carouselTiles), [carouselTiles]);

	const tilesForPage = useMemo(() => {
		const tileHeight = (dimensions.width / 16) * 9 + 20;
		return Math.floor(dimensions.height / tileHeight);
	}, [dimensions]);

	const {
		rowIndex: index,
		prevButton,
		nextButton,
		showPaginationButtons
	} = usePagination(totalTiles, tilesForPage, 3);

	const tilesDataToRender = useMemo(
		() => carouselTiles.slice(index, index + tilesForPage),
		[carouselTiles, index, tilesForPage]
	);

	const tilesToRender = useMemo(
		() =>
			map(tilesDataToRender, (tile) => (
				<Tile
					key={`tile-${tile.userId}/${tile.type}`}
					userId={tile.userId}
					meetingId={meetingId}
					isScreenShare={tile.type === STREAM_TYPE.SCREEN}
				/>
			)),
		[meetingId, tilesDataToRender]
	);

	// Subscribe tiles' stream
	useEffect(() => {
		if (tilesDataToRender.length > 0) {
			const subscriptions = map(tilesDataToRender, (value) => ({
				userId: value.userId,
				type: value.type
			}));
			subscriptions.push({ userId: centralTile.userId, type: centralTile.type });
			setUpdateSubscription(meetingId, subscriptions);
		}
	}, [videoScreenIn, tilesDataToRender, centralTile, meetingId, setUpdateSubscription]);

	return (
		<TilesBarContainer mainAlignment="space-between">
			{showPaginationButtons && (
				<ButtonUpContainer width="fill" height="fit">
					<Tooltip label={prevButton.disabled ? topLabel : scrollUpLabel} placement="left">
						<IconButton
							iconColor="gray6"
							backgroundColor="text"
							icon="ChevronUpOutline"
							size="large"
							width="fill"
							onClick={prevButton.onClick}
							disabled={prevButton.disabled}
						/>
					</Tooltip>
				</ButtonUpContainer>
			)}
			<TileContainer ref={tilesContainerRef}>{tilesToRender}</TileContainer>
			{showPaginationButtons && (
				<ButtonDownContainer width="fill" height="fit">
					<Tooltip label={nextButton.disabled ? bottomLabel : scrollDownLabel} placement="left">
						<IconButton
							iconColor="gray6"
							backgroundColor="text"
							icon="ChevronDownOutline"
							size="large"
							width="fill"
							onClick={nextButton.onClick}
							disabled={nextButton.disabled}
						/>
					</Tooltip>
				</ButtonDownContainer>
			)}
		</TilesBarContainer>
	);
};

export default TilesBar;
