/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import TileExample from './TileCarousel';
import { getMeetingCarouselVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingParticipantMap } from '../../../../types/store/MeetingTypes';
import {
	calcTilesQuantity,
	listOfTileToShow,
	positionToStartOnNextButton,
	positionToStartOnPrevButton
} from '../../../../utils/MeetingsUtils';

const SidebarIconButton = styled(IconButton)`
	height: 15rem;
	width: 2.25rem;
`;

const ArrowButton = styled(IconButton)`
	width: 16rem;
`;

// ordered by chronicle access tot the meeting
const us1 = 'us1'; // userId-screen
const us2 = 'us2'; // userId-video
const us3 = 'us3';
const us4 = 'us4';
const us5 = 'us5';
const us6 = 'us6';
const us7 = 'us7';
const us8 = 'us8';
const streamsInMeeting = [us1, us2, us3, us4, us5, us6, us7, us8];

const StreamsCarousel = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const isCarouselVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);

	const [numOfTilesToDisplay, setNumOfTilesToDisplay] = useState(0);
	const [lastTileIdxPosition, setLastTileIdxPosition] = useState<null | number>(null);
	const [tilesToDisplay, setTilesToDisplay] = useState<string[]>([]);

	const streamWrapperRef = useRef<null | HTMLDivElement>(null);

	// const oldStreamsCarousel = useMemo(
	// 	() => map(meetingParticipants, () => <TileExample meetingId={meetingId} />),
	// 	[meetingParticipants, meetingId]
	// );

	const streamsCarousel = useMemo(
		() => map(tilesToDisplay, (tile) => <TileExample meetingId={meetingId} tileTitle={tile} />),
		[meetingId, tilesToDisplay]
	);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(meetingId, !isCarouselVisible);
	}, [isCarouselVisible, meetingId, setIsCarouselVisible]);

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
		<Container orientation="horizontal" width="fit" height="fill">
			<Container padding={{ horizontal: 'large' }}>
				<Tooltip label={'needed to add'}>
					<SidebarIconButton
						onClick={toggleCarousel}
						iconColor="gray6"
						backgroundColor="text"
						icon={true ? 'ChevronRightOutline' : 'ChevronLeftOutline'}
						size="large"
					/>
				</Tooltip>
			</Container>
			{isCarouselVisible && (
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
			)}
		</Container>
	);
};

export default StreamsCarousel;
