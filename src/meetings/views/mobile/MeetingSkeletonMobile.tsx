/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';

import useGeneralMeetingControls from '../../../hooks/useGeneralMeetingControls';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import Logo from '../../components/Logo';
import MobileActionBar from '../../components/mobile/MobileActionBar';

export enum MobileMeetingView {
	TILES = 'tiles',
	CHAT = 'chat',
	PARTICIPANTS = 'participants'
}

const MeetingSkeletonMobile = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [view, setView] = React.useState<MobileMeetingView>(MobileMeetingView.TILES);

	useGeneralMeetingControls(meetingId);

	return (
		<Container background="gray0" padding="2rem">
			<Logo top="2rem" left="2rem" />
			<Container>
				{view === MobileMeetingView.TILES && <Container>Meeting Tiles</Container>}
				{view === MobileMeetingView.CHAT && <Container>Chat</Container>}
				{view === MobileMeetingView.PARTICIPANTS && <Container>Participants</Container>}
			</Container>
			<MobileActionBar meetingId={meetingId} view={view} setView={setView} />
		</Container>
	);
};

export default MeetingSkeletonMobile;
