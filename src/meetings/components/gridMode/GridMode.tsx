/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useRef } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { forEach, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import usePagination from '../../../hooks/usePagination';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getVideoScreenIn } from '../../../store/selectors/ActiveMeetingSelectors';
import { getNumberOfTiles, getTiles } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, SubscriptionMap, TileData } from '../../../types/store/ActiveMeetingTypes';
import {
	calcGrid,
	mapToSubscriptionMap,
	maximiseRowsAndColumns,
	maximiseTileSize
} from '../../../utils/MeetingsUtils';
import Tile from '../Tile';

const GridContainer = styled(Container)`
	position: relative;
	display: flex;
	justify-content: center;
	gap: 1rem;
	padding: 3.25rem;
`;

const RowContainer = styled(Container)`
	gap: 1rem;
`;

const ButtonUpContainer = styled(Container)`
	position: absolute;
	top: 0;
	right: 0;
	height: calc(50% - 0.5rem);
`;

const ButtonDownContainer = styled(Container)`
	position: absolute;
	bottom: 0;
	right: 0;
	height: calc(50% - 0.5rem);
	z-index: 100;
`;

const ChevronIconButton = styled(IconButton)`
	width: 2.25rem;
	height: 15rem;
	max-height: 15rem;
`;

const GridMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const scrollUpLabel = t('tooltip.scrollUp', 'Scroll up');
	const scrollDownLabel = t('tooltip.scrollDown', 'Scroll down');
	const topLabel = t('tooltip.topOfList', 'Top of list');
	const bottomLabel = t('tooltip.bottomOfList', 'Bottom of list');

	const gridContainerRef = useRef<HTMLDivElement>(null);
	const dimensions = useContainerDimensions(gridContainerRef);

	const tilesData: TileData[] = useStore((store) => getTiles(store, meetingId));
	const numberOfTiles = useStore((store) => getNumberOfTiles(store, meetingId));
	const videoScreenIn = useStore((store) => getVideoScreenIn(store, meetingId));
	const myUserId = useStore(getUserId);

	const { tileWidth, rows, columns, numberOfPages } = useMemo(() => {
		// Calculate a full density grid
		const minTileWidth = 300;
		let { rows, columns } = maximiseRowsAndColumns(dimensions, minTileWidth);
		let { tileWidth } = calcGrid(dimensions, rows, columns);
		const numberOfPages = Math.ceil(numberOfTiles / (rows * columns));

		// If isn't necessary to paginate, recalculate rows and columns to best fit the tiles in the container
		if (numberOfPages <= 1) {
			const result = maximiseTileSize(dimensions, numberOfTiles);
			tileWidth = result.tileWidth;
			rows = result.rows;
			columns = result.columns;
		}
		return { tileWidth, rows, columns, numberOfPages };
	}, [dimensions, numberOfTiles]);

	const { rowIndex, prevButton, nextButton, showPaginationButtons } = usePagination(
		numberOfPages > 1 ? Math.ceil(numberOfTiles / columns) : 0,
		rows
	);

	const tilesToRender = useMemo(
		() =>
			numberOfPages <= 1
				? tilesData
				: tilesData.slice(rowIndex * columns, rowIndex * columns + rows * columns),
		[numberOfPages, tilesData, rowIndex, columns, rows]
	);

	const rowsToRender = useMemo(() => {
		const rowsArray = [];
		for (let row = 0; row < rows; row += 1) {
			const rowTiles = [];
			for (let column = 0; column < columns; column += 1) {
				const tileIndex = row * columns + column;
				if (tileIndex < size(tilesToRender) && tilesToRender[tileIndex]) {
					rowTiles.push(
						<Container
							width={`${tileWidth / 16}rem`}
							height="fit"
							key={`tile-${tileIndex}-container`}
						>
							<Tile
								userId={tilesToRender[tileIndex].userId}
								meetingId={meetingId}
								key={`tile-${tileIndex}`}
								isScreenShare={tilesToRender[tileIndex].type === STREAM_TYPE.SCREEN}
							/>
						</Container>
					);
				}
			}
			rowsArray.push(
				<RowContainer orientation="horizontal" height="fit" key={`row-${row}`}>
					{rowTiles}
				</RowContainer>
			);
		}
		return rowsArray;
	}, [rows, columns, tilesToRender, tileWidth, meetingId]);

	useEffect(() => {
		const tilesDataToSubscribe: SubscriptionMap = {};
		if (tilesToRender.length >= 3) {
			forEach(tilesToRender, (tile) => {
				if (myUserId === tile.userId) return;
				mapToSubscriptionMap(tilesDataToSubscribe, tile.userId, tile.type);
			});
			videoScreenIn?.subscriptionManager.updateSubscription(tilesDataToSubscribe);
		}
	}, [meetingId, myUserId, tilesToRender, videoScreenIn]);

	return (
		<GridContainer data-testid="gridModeView" mainAlignment="space-between" ref={gridContainerRef}>
			{showPaginationButtons && (
				<ButtonUpContainer width="fit" height="fit" mainAlignment="flex-end">
					<Tooltip label={prevButton.disabled ? topLabel : scrollUpLabel} placement="left">
						<ChevronIconButton
							iconColor="gray6"
							backgroundColor="text"
							icon="ChevronUpOutline"
							size="large"
							onClick={prevButton.onClick}
							disabled={prevButton.disabled}
						/>
					</Tooltip>
				</ButtonUpContainer>
			)}
			{rowsToRender}
			{showPaginationButtons && (
				<ButtonDownContainer width="fit" height="fitt" mainAlignment="flex-start">
					<Tooltip label={nextButton.disabled ? bottomLabel : scrollDownLabel} placement="left">
						<ChevronIconButton
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
		</GridContainer>
	);
};

export default GridMode;
