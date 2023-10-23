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
import {
	getMeetingCarouselVisibility,
	getTalkingList
} from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';

const SpeakingListContainer = styled(Container)`
	position: absolute;
	top: 1rem;
	right: 1rem;
	z-index: 40;
`;

type WhoIsSpeakingProps = {
	centralTile: TileData;
};

const WhoIsSpeaking = ({ centralTile }: WhoIsSpeakingProps): ReactElement | null => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const talkingMap = useStore((store) => getTalkingList(store, meetingId));
	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));

	const speakingList = useMemo(() => {
		const list: ReactElement[] = [];
		map(talkingMap, (talkingId) => {
			if (
				centralTile.userId &&
				!(centralTile.userId === talkingId && centralTile.type === STREAM_TYPE.VIDEO)
			) {
				list.push(<SpeakingElement key={`${talkingId}-isTalking`} userId={talkingId} />);
			}
		});
		return list;
	}, [talkingMap, centralTile]);

	return !carouselIsVisible ? (
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
