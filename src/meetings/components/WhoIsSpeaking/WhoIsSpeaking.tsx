/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import SpeakingElement from './SpeakingElement';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import {
	getMeetingCarouselVisibility,
	getMeetingViewSelected,
	getTalkingList
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getTotalNumberOfTiles } from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';

const SpeakingListContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	right: 1rem;
	z-index: 40;
`;

const WhoIsSpeaking = (): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useTilesOrder(meetingId);
	const talkingMap = useStore((store) => getTalkingList(store, meetingId));
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const numberOfTiles = useStore((store) => getTotalNumberOfTiles(store, meetingId));

	const speakingList = useMemo(() => {
		const list: ReactElement[] = [];
		map(talkingMap, (talkingId) => {
			if (centralTile.userId && centralTile.userId !== talkingId) {
				list.push(<SpeakingElement key={`${talkingId}-isTalking`} userId={talkingId} />);
			}
		});
		return list;
	}, [talkingMap, centralTile]);

	const whoIsSpeakingHasToAppear = useMemo(
		() =>
			((meetingViewSelected === MeetingViewType.CINEMA && !carouselIsVisible) ||
				meetingViewSelected === MeetingViewType.GRID) &&
			numberOfTiles > 2,
		[carouselIsVisible, meetingViewSelected, numberOfTiles]
	);

	return whoIsSpeakingHasToAppear ? (
		<SpeakingListContainer
			height="fit"
			width="fit"
			mainAlignment="flex-end"
			crossAlignment="flex-end"
			gap="0.5rem"
		>
			{speakingList}
		</SpeakingListContainer>
	) : null;
};

export default WhoIsSpeaking;
