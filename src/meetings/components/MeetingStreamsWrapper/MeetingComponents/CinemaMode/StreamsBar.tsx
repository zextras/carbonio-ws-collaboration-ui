/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { getMeetingParticipantsByMeetingId } from '../../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../../store/Store';
import { MeetingParticipantMap } from '../../../../../types/store/MeetingTypes';
import {
	calcTilesQuantity,
	listOfTileToShow,
	positionToStartOnNextButton,
	positionToStartOnPrevButton
} from '../../../../../utils/MeetingsUtils';
import { SimpleTestTile } from '../TestTile';

const ArrowButton = styled(IconButton)`
	width: 16rem;
`;

const streamsInMeeting = ['1', '2', '3', '4', '5'];

const StreamsBar = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);

	const [numOfTilesToDisplay, setNumOfTilesToDisplay] = useState(0);
	const [lastTileIdxPosition, setLastTileIdxPosition] = useState<null | number>(null);
	const [tilesToDisplay, setTilesToDisplay] = useState<string[]>([]);

	const streamWrapperRef = useRef<null | HTMLDivElement>(null);

	const streamsCarousel = useMemo(
		() => map(tilesToDisplay, (tile) => <SimpleTestTile userId={tile} />),
		[tilesToDisplay]
	);

	const handleClickOnPrevButton = useCallback(() => {
		const lastPosUpdated = positionToStartOnPrevButton(
			numOfTilesToDisplay,
			streamsInMeeting,
			lastTileIdxPosition
		);
		setLastTileIdxPosition(lastPosUpdated);
	}, [numOfTilesToDisplay, lastTileIdxPosition]);

	const handleClickOnNextButton = useCallback(() => {
		const lastPosUpdated = positionToStartOnNextButton(
			numOfTilesToDisplay,
			streamsInMeeting,
			lastTileIdxPosition
		);
		setLastTileIdxPosition(lastPosUpdated);
	}, [numOfTilesToDisplay, lastTileIdxPosition]);

	useEffect(() => {
		const numOfTiles = calcTilesQuantity(streamWrapperRef.current?.offsetHeight ?? 0);
		const idsListTileToShow = listOfTileToShow(numOfTiles, streamsInMeeting, lastTileIdxPosition);
		setNumOfTilesToDisplay(numOfTiles);
		setTilesToDisplay(idsListTileToShow);
	}, [meetingParticipants, numOfTilesToDisplay, lastTileIdxPosition]);

	return (
		<Container mainAlignment="space-between">
			<ArrowButton
				onClick={handleClickOnPrevButton}
				conColor="gray6"
				backgroundColor="text"
				icon="ChevronUpOutline"
				size="large"
			/>
			<Container ref={streamWrapperRef}>{streamsCarousel}</Container>
			<ArrowButton
				onClick={handleClickOnNextButton}
				conColor="gray6"
				backgroundColor="text"
				icon="ChevronDownOutline"
				size="large"
			/>
		</Container>
	);
};

export default StreamsBar;
