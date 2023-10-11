/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import SpeakingElement from './SpeakingElement';
import { MeetingRoutesParams } from '../../hooks/useRouting';
import useTilesOrder from '../../hooks/useTilesOrder';
import {
	getMeetingCarouselVisibility,
	getCarouselNumberOfTiles,
	getMeetingViewSelected,
	getTalkingList,
	getCarouselIndex
} from '../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../store/Store';
import { MeetingViewType } from '../../types/store/ActiveMeetingTypes';

const SpeakingListContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	right: 1rem;
`;

const WhoIsSpeaking = (): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile, carouselTiles } = useTilesOrder(meetingId);
	const talkingMap = useStore((store) => getTalkingList(store, meetingId));
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const carouselNumberOfTiles = useStore((store) => getCarouselNumberOfTiles(store, meetingId));
	const index = useStore((store) => getCarouselIndex(store, meetingId));

	const speakingList = useMemo(() => {
		const list: string[] = [];
		const selectedTiles = carouselTiles.slice(index, index + carouselNumberOfTiles);
		map(talkingMap, (talkingId) => {
			const talkingVisibleTile = selectedTiles.find((tile) => tile.userId === talkingId);
			if (centralTile.userId !== talkingId) {
				if ((carouselIsVisible && talkingVisibleTile === undefined) || !carouselIsVisible) {
					list.push(talkingId);
				}
			}
		});
		return list;
	}, [carouselTiles, index, carouselNumberOfTiles, talkingMap, centralTile, carouselIsVisible]);

	const speakingListComponent = useMemo(
		() => map(speakingList, (speakerId) => <SpeakingElement userId={speakerId} />),
		[speakingList]
	);

	const whoIsSpeakingHasToAppear = useMemo(
		() =>
			meetingViewSelected === MeetingViewType.CINEMA ||
			meetingViewSelected === MeetingViewType.GRID,
		[meetingViewSelected]
	);

	return whoIsSpeakingHasToAppear ? (
		<SpeakingListContainer height="fit" width="fit">
			<Container mainAlignment="flex-end" crossAlignment="flex-end">
				{speakingListComponent}
			</Container>
		</SpeakingListContainer>
	) : null;
};

export default WhoIsSpeaking;
