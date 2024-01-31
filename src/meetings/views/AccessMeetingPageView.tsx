/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { MeetingsApi } from '../../network';
import { getRoomIdFromMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import AccessMeetingModal from '../components/AccessMeetingModal';
import WaitingRoom from '../components/waitingRoom/WaitingRoom';

const AccessMeetingPageView = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) || ``);

	const [canUserAccessMeeting, setCanUserAccessMeeting] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		MeetingsApi.getMeetingByMeetingId(meetingId)
			.then(() => setCanUserAccessMeeting(true))
			.catch(() => setCanUserAccessMeeting(false));
	}, [meetingId]);

	return (
		<Container background="gray0">
			{canUserAccessMeeting === true && <AccessMeetingModal roomId={roomId} />}
			{canUserAccessMeeting === false && <WaitingRoom meetingId={meetingId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
