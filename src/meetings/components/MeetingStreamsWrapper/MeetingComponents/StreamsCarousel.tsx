/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { ReactElement, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import TileExample from './TileCarousel';
import { getMeetingCarouselVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getMeetingParticipantsByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingParticipantMap } from '../../../../types/store/MeetingTypes';

const SidebarIconButton = styled(IconButton)`
	height: 15rem;
	width: 2.25rem;
`;

const ArrowButton = styled(IconButton)`
	width: 16rem;
`;

const StreamsCarousel = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const isCarouselVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);
	const meetingParticipants: MeetingParticipantMap | undefined = useStore((store) =>
		getMeetingParticipantsByMeetingId(store, meetingId)
	);

	const streamsCarousel = useMemo(
		() => map(meetingParticipants, () => <TileExample meetingId={meetingId} />),
		[meetingParticipants, meetingId]
	);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(meetingId, !isCarouselVisible);
	}, [isCarouselVisible, meetingId, setIsCarouselVisible]);

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
			<Container mainAlignment="space-between">
				<ArrowButton conColor="gray6" backgroundColor="text" icon="ChevronUpOutline" size="large" />
				{isCarouselVisible && <Container>{streamsCarousel}</Container>}
				<ArrowButton
					conColor="gray6"
					backgroundColor="text"
					icon="ChevronDownOutline"
					size="large"
				/>
			</Container>
		</Container>
	);
};

export default StreamsCarousel;
