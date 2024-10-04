/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useGeneralMeetingControls from '../../../hooks/useGeneralMeetingControls';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import useStore from '../../../store/Store';
import { UserType } from '../../../types/store/UserTypes';
import { BrowserUtils } from '../../../utils/BrowserUtils';
import Logo from '../../components/Logo';
import MobileActionBar from '../../components/mobile/MobileActionBar';
import MobileConversation from '../../components/mobile/MobileConversation';
import MobileParticipants from '../../components/mobile/MobileParticipants';
import MobileTilesView from '../../components/mobile/MobileTilesView';
import RecordingInfo from '../../components/RecordingInfo';

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

	const leaveMeeting = useCallback(() => {
		const isLoggedUserExternal = useStore.getState().session.userType === UserType.GUEST;
		MeetingsApi.leaveMeeting(meetingId);
		if (isLoggedUserExternal) {
			BrowserUtils.clearAuthCookies();
		}
	}, [meetingId]);

	useEffect(() => {
		window.addEventListener('pagehide', leaveMeeting);
		return (): void => {
			window.removeEventListener('pagehide', leaveMeeting);
		};
	}, [leaveMeeting]);

	return (
		<Container background="gray0" padding={{ vertical: '4.4rem', horizontal: '1rem' }}>
			<RecordingInfo meetingId={meetingId} />
			<Logo top="2rem" left="2rem" />
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
