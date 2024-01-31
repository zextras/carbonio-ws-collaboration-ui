/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { getMeetingExists, getRoomIdFromMeeting } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import AccessMeetingModal from '../components/AccessMeetingModal';

const AccessMeetingPageView = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) || ``);

	const areMeetingsDataAvailable = useStore(({ connections }) => connections.status.chats_be);
	const canUserAccessToMeeting = useStore((store) => getMeetingExists(store, meetingId));

	const AccessComponent = useMemo(
		() =>
			canUserAccessToMeeting ? <AccessMeetingModal roomId={roomId} /> : <div>Waiting room</div>,
		[canUserAccessToMeeting, roomId]
	);

	return <Container background="gray0">{areMeetingsDataAvailable && AccessComponent}</Container>;
};

export default AccessMeetingPageView;
