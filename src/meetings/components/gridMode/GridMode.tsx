/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../Tile';

const GridContainer = styled(Container)`
	position: relative;
`;

const TileContainer = styled(Container)`
	gap: 1rem;
`;

const ButtonUpContainer = styled(Container)`
	position: absolute;
	top: 0;
	right: calc(-2.125rem / 2 - 2.125rem);
	height: 40%;
`;

const ButtonDownContainer = styled(Container)`
	position: absolute;
	bottom: 0;
	right: calc(-2.125rem / 2 - 2.125rem);
	height: 40%;
`;

const GridMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const tilesData: TileData[] = useStore((store) => getTiles(store, meetingId));

	const [t] = useTranslation();
	const scrollUpLabel = t('tooltip.scrollUp', 'Scroll up');
	const scrollDownLabel = t('tooltip.scrollDown', 'Scroll down');
	const topLabel = t('tooltip.topOfList', 'Top of list');
	const bottomLabel = t('tooltip.bottomOfList', 'Bottom of list');

	const tilesContainerRef = useRef<HTMLDivElement>(null);

	const [index, setIndex] = useState(0);

	const dimensions = useContainerDimensions(tilesContainerRef);

	const totalTiles = useMemo(() => size(tilesData), [tilesData]);
	const step = 1;

	const tilesForPage = useMemo(() => {
		const tileHeight = (dimensions.width / 16) * 9 + 20;
		return Math.floor(dimensions.height / tileHeight);
	}, [dimensions]);

	const tilesToRender = useMemo(() => {
		const selectedTiles = tilesData.slice(index, index + tilesForPage);
		return map(selectedTiles, (tile) => (
			<Tile
				userId={tile.userId}
				meetingId={meetingId}
				isScreenShare={tile.type === STREAM_TYPE.SCREEN}
			/>
		));
	}, [tilesData, index, meetingId, tilesForPage]);

	const clickPrevButton = useCallback(
		() => setIndex((prev) => (prev - step > 0 ? prev - step : 0)),
		[step]
	);

	const clickNextButton = useCallback(
		() =>
			setIndex((prev) =>
				prev + step >= totalTiles - tilesForPage ? totalTiles - tilesForPage : prev + step
			),
		[step, tilesForPage, totalTiles]
	);

	const prevButtonDisabled = useMemo(() => index === 0, [index]);

	const nextButtonDisabled = useMemo(
		() => index === totalTiles - tilesForPage,
		[index, tilesForPage, totalTiles]
	);

	const showButtons = useMemo(() => {
		if (tilesForPage === 0) return false;
		return totalTiles > tilesForPage;
	}, [tilesForPage, totalTiles]);

	return (
		<GridContainer data-testid="gridModeView" mainAlignment="space-between">
			{showButtons && (
				<ButtonUpContainer width="fit" height="fit">
					<Tooltip label={prevButtonDisabled ? topLabel : scrollUpLabel} placement="left">
						<IconButton
							conColor="gray6"
							backgroundColor="text"
							icon="ChevronUpOutline"
							size="large"
							height="fill"
							onClick={clickPrevButton}
							disabled={prevButtonDisabled}
						/>
					</Tooltip>
				</ButtonUpContainer>
			)}
			<TileContainer ref={tilesContainerRef}>{tilesToRender}</TileContainer>
			{showButtons && (
				<ButtonDownContainer width="fit" height="fit">
					<Tooltip label={nextButtonDisabled ? bottomLabel : scrollDownLabel} placement="left">
						<IconButton
							conColor="gray6"
							backgroundColor="text"
							icon="ChevronDownOutline"
							size="large"
							width="fill"
							onClick={clickNextButton}
							disabled={nextButtonDisabled}
						/>
					</Tooltip>
				</ButtonDownContainer>
			)}
		</GridContainer>
	);
};

export default GridMode;
