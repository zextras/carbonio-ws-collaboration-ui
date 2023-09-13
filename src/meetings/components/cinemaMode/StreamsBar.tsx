/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useCalculateTilesOrder from '../../../hooks/useCalculateTilesOrder';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { SimpleTestTile } from '../TestTile';

const StreamBarContainer = styled(Container)`
	padding: 1rem 1rem 1rem 0;
`;

const TileContainer = styled(Container)`
	gap: 1rem;
`;

const ArrowButton = styled(IconButton)`
	width: 100%;
`;

const StreamsBar = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [index, setIndex] = useState(0);

	const tilesContainerRef = useRef<HTMLDivElement>(null);

	const { carouselTiles } = useCalculateTilesOrder(meetingId);
	const totalTiles = useMemo(() => size(carouselTiles), [carouselTiles]);
	const step = useMemo(() => (totalTiles > 3 ? 3 : totalTiles), [totalTiles]);

	// TODO calculate how many tiles can max be shown
	const tilesForPage = useMemo(() => 5, []);

	const tilesToRender = useMemo(() => {
		const selectedTiles = carouselTiles.slice(index, index + tilesForPage);
		return map(selectedTiles, (tile) => <SimpleTestTile userId={tile.userId} />);
	}, [carouselTiles, index, tilesForPage]);

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

	const showButtons = useMemo(() => totalTiles > tilesForPage, [tilesForPage, totalTiles]);

	return (
		<StreamBarContainer mainAlignment="space-between">
			{showButtons && (
				<ArrowButton
					conColor="gray6"
					backgroundColor="text"
					icon="ChevronUpOutline"
					size="large"
					onClick={clickPrevButton}
					disabled={prevButtonDisabled}
				/>
			)}
			<TileContainer ref={tilesContainerRef}>{tilesToRender}</TileContainer>
			{showButtons && (
				<ArrowButton
					conColor="gray6"
					backgroundColor="text"
					icon="ChevronDownOutline"
					size="large"
					onClick={clickNextButton}
					disabled={nextButtonDisabled}
				/>
			)}
		</StreamBarContainer>
	);
};

export default StreamsBar;
