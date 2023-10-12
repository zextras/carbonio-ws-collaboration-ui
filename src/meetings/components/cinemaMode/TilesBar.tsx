/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import React, { ReactElement, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useContainerDimensions from '../../../hooks/useContainerDimensions';
import usePagination from '../../../hooks/usePagination';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import Tile from '../Tile';

const TilesBarContainer = styled(Container)`
	padding: 3.24rem 1rem 3.25rem 0;
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
`;

const TilesBar = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const scrollUpLabel = t('tooltip.scrollUp', 'Scroll up');
	const scrollDownLabel = t('tooltip.scrollDown', 'Scroll down');
	const topLabel = t('tooltip.topOfList', 'Top of list');
	const bottomLabel = t('tooltip.bottomOfList', 'Bottom of list');

	const tilesContainerRef = useRef<HTMLDivElement>(null);

	const { carouselTiles } = useTilesOrder(meetingId);

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

	const tilesToRender = useMemo(() => {
		const selectedTiles = carouselTiles.slice(index, index + tilesForPage);
		return map(selectedTiles, (tile) => (
			<Tile
				key={`tile-${index}`}
				userId={tile.userId}
				meetingId={meetingId}
				isScreenShare={tile.type === STREAM_TYPE.SCREEN}
			/>
		));
	}, [carouselTiles, index, meetingId, tilesForPage]);

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
