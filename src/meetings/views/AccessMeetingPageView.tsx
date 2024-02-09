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

	const [hasUserDirectAccess, setHasUserDirectAccess] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		setHasUserDirectAccess(true);
		MeetingsApi.getMeetingByMeetingId(meetingId)
			.then((resp) => {
				if (resp.meetingType === MeetingType.PERMANENT || amIModerator) {
					setHasUserDirectAccess(true);
				} else {
					setHasUserDirectAccess(false);
				}
			})
			.catch(() => setHasUserDirectAccess(false));
	}, [amIModerator, meetingId]);

	useEffect(() => {
		if (meetingType === MeetingType.SCHEDULED && hasUserDirectAccess && amIModerator) {
			MeetingsApi.getWaitingList(meetingId);
		}
	}, [amIModerator, hasUserDirectAccess, meetingId, meetingType]);

	return (
		<Container background="gray0">
			{hasUserDirectAccess === true && <AccessMeetingModal roomId={roomId} />}
			{hasUserDirectAccess === false && <WaitingRoom meetingId={meetingId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
