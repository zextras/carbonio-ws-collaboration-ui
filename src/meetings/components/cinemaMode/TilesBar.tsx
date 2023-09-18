/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { debounce, map, size } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { getMeetingSidebarStatus } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
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

	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const tilesContainerRef = useRef<HTMLDivElement>(null);

	const [index, setIndex] = useState(0);
	const [dimensions, setCarouselDimensions] = useState({ width: 0, height: 0 });

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleResize = useCallback(
		debounce((): void => {
			if (tilesContainerRef.current) {
				setCarouselDimensions({
					width: tilesContainerRef.current.offsetWidth,
					height: tilesContainerRef.current.offsetHeight
				});
			}
		}, 100),
		[]
	);

	useEffect(() => handleResize(), [handleResize, sidebarStatus]);

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	const { carouselTiles } = useTilesOrder(meetingId);
	const totalTiles = useMemo(() => size(carouselTiles), [carouselTiles]);
	const step = useMemo(() => (totalTiles > 3 ? 3 : totalTiles), [totalTiles]);

	const tilesForPage = useMemo(() => {
		const tileHeight = (dimensions.width / 16) * 9 + 20;
		return Math.floor(dimensions.height / tileHeight);
	}, [dimensions]);

	const tilesToRender = useMemo(() => {
		const selectedTiles = carouselTiles.slice(index, index + tilesForPage);
		return map(selectedTiles, (tile) => <Tile userId={tile.userId} meetingId={meetingId} />);
	}, [carouselTiles, index, meetingId, tilesForPage]);

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
		<TilesBarContainer mainAlignment="space-between">
			{showButtons && (
				<ButtonUpContainer width="fill" height="fit">
					<Tooltip label={prevButtonDisabled ? topLabel : scrollUpLabel} placement="left">
						<IconButton
							conColor="gray6"
							backgroundColor="text"
							icon="ChevronUpOutline"
							size="large"
							width="fill"
							onClick={clickPrevButton}
							disabled={prevButtonDisabled}
						/>
					</Tooltip>
				</ButtonUpContainer>
			)}
			<TileContainer ref={tilesContainerRef}>{tilesToRender}</TileContainer>
			{showButtons && (
				<ButtonDownContainer width="fill" height="fit">
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
		</TilesBarContainer>
	);
};

export default TilesBar;
