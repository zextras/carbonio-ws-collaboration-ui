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
import MobileParticipants from '../../components/mobile/MobileParticipants';
import MobileTilesView from '../../components/mobile/MobileTilesView';

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
		<Container background="gray0" padding={{ top: '4rem', bottom: '1rem', horizontal: '1rem' }}>
			<Logo top="1.5rem" left="1.5rem" />
			<CustomContainer>
				{view === MobileMeetingView.TILES && <MobileTilesView meetingId={meetingId} />}
				{view === MobileMeetingView.CHAT && <MobileConversation meetingId={meetingId} />}
				{view === MobileMeetingView.PARTICIPANTS && <MobileParticipants meetingId={meetingId} />}
			</CustomContainer>
			<MobileActionBar meetingId={meetingId} view={view} setView={setView} />
		</Container>
	);
};

export default MeetingSkeletonMobile;
