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
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import {
	getMeetingCarouselVisibility,
	getMeetingViewSelected,
	getTalkingList
} from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';

const SpeakingListContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	right: 1rem;
`;

const WhoIsSpeaking = (): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const { centralTile } = useTilesOrder(meetingId);
	const talkingMap = useStore((store) => getTalkingList(store, meetingId));
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));

	const speakingList = useMemo(() => {
		const list: ReactElement[] = [];
		map(talkingMap, (talkingId) => {
			if (centralTile.userId !== talkingId) {
				list.push(<SpeakingElement key={`${talkingId}-isTalking`} userId={talkingId} />);
			}
		});
		return list;
	}, [talkingMap, centralTile]);

	const whoIsSpeakingHasToAppear = useMemo(
		() =>
			(meetingViewSelected === MeetingViewType.CINEMA ||
				meetingViewSelected === MeetingViewType.GRID) &&
			!carouselIsVisible,
		[carouselIsVisible, meetingViewSelected]
	);

	return whoIsSpeakingHasToAppear ? (
		<SpeakingListContainer height="fit" width="fit">
			<Container mainAlignment="flex-end" crossAlignment="flex-end">
				{speakingList}
			</Container>
		</SpeakingListContainer>
	) : null;
};

export default WhoIsSpeaking;
