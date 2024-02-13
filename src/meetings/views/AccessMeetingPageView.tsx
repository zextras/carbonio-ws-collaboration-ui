/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { find } from 'lodash';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { MeetingsApi } from '../../network';
import { getRoomIdFromMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import AccessMeetingModal from '../components/meetingAccessPoints/accessModal/AccessMeetingModal';
import WaitingRoom from '../components/meetingAccessPoints/waitingRoom/WaitingRoom';

const AccessMeetingPageView = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) || ``);

	const [hasUserDirectAccess, setHasUserDirectAccess] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		if (chatsBeNetworkStatus) {
			MeetingsApi.getMeetingByMeetingId(meetingId)
				.then((meeting) => {
					const room = find(useStore.getState().rooms, (room) => room.meetingId === meetingId);
					const iAmOwner = find(
						room?.members,
						(member) => member.userId === useStore.getState().session.id && member.owner
					);
					// Modal access for permanent meeting and scheduled owners
					if (meeting.meetingType === MeetingType.PERMANENT || iAmOwner) {
						setHasUserDirectAccess(true);
					} else {
						// Waiting room access for external and scheduled member
						setHasUserDirectAccess(false);
					}
				})
				.catch(() => setHasUserDirectAccess(false));
		}
	}, [chatsBeNetworkStatus, meetingId]);

	return (
		<Container background="gray0">
			{hasUserDirectAccess === true && <AccessMeetingModal roomId={roomId} />}
			{hasUserDirectAccess === false && <WaitingRoom meetingId={meetingId} />}
		</Container>
	);
};

export default AccessMeetingPageView;
