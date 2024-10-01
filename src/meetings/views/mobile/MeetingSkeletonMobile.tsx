/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useGeneralMeetingControls from '../../../hooks/useGeneralMeetingControls';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import Logo from '../../components/Logo';
import MobileActionBar from '../../components/mobile/MobileActionBar';
import MobileConversation from '../../components/mobile/MobileConversation';

export enum MobileMeetingView {
	TILES = 'tiles',
	CHAT = 'chat',
	PARTICIPANTS = 'participants'
}

const CustomContainer = styled(Container)`
	overflow: hidden;
`;

const MeetingSkeletonMobile = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [view, setView] = React.useState<MobileMeetingView>(MobileMeetingView.TILES);

	useGeneralMeetingControls(meetingId);

	return (
		<Container
			background="gray0"
			padding={{ top: '4rem', bottom: '2rem', horizontal: '2rem' }}
			gap="1rem"
		>
			<Logo top="2rem" left="2rem" />
			<CustomContainer>
				{view === MobileMeetingView.TILES && <Container>Meeting Tiles</Container>}
				{view === MobileMeetingView.CHAT && <MobileConversation meetingId={meetingId} />}
				{view === MobileMeetingView.PARTICIPANTS && <Container>Participants</Container>}
			</CustomContainer>
			<MobileActionBar meetingId={meetingId} view={view} setView={setView} />
		</Container>
	);
};

export default MeetingSkeletonMobile;
