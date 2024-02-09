/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { MeetingsApi } from '../../network';
import { getMeetingType, getRoomIdFromMeeting } from '../../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import AccessMeetingModal from '../components/meetingAccessPoints/accessModal/AccessMeetingModal';
import WaitingRoom from '../components/meetingAccessPoints/waitingRoom/WaitingRoom';

const AccessMeetingPageView = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) || ``);
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId || ''));
	const meetingType = useStore((store) => getMeetingType(store, meetingId));

	const [canUserAccessMeeting, setCanUserAccessMeeting] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		MeetingsApi.getMeetingByMeetingId(meetingId)
			.then(() => setCanUserAccessMeeting(true))
			.catch(() => setCanUserAccessMeeting(false));
	}, [meetingId]);

	useEffect(() => {
		if (meetingType === MeetingType.SCHEDULED && canUserAccessMeeting && amIModerator) {
			MeetingsApi.getWaitingList(meetingId);
		}
	}, [amIModerator, canUserAccessMeeting, meetingId, meetingType]);

	return (
		<Container background="gray0">
			{canUserAccessMeeting === true && <AccessMeetingModal roomId={roomId} />}
			{canUserAccessMeeting === false && <WaitingRoom meetingId={meetingId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
