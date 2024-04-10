/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAuthenticated } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { MEETINGS_PATH } from '../../constants/appConstants';
import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import AccessMeetingPage from '../components/meetingAccessPoint/AccessMeetingPage';

const AccessMeetingPageView = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const [hasUserDirectAccess, setHasUserDirectAccess] = useState<boolean | undefined>(undefined);
	const [meetingName, setMeetingName] = useState<string>('');

	const { goToInfoPage } = useRouting();
	const authenticated = useAuthenticated();

	useEffect(() => {
		if (!authenticated) goToInfoPage(PAGE_INFO_TYPE.UNAUTHENTICATED);
	}, [authenticated, goToInfoPage]);

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
						// Waiting room access for scheduled member
						setHasUserDirectAccess(false);
						setMeetingName(meeting.name);
					}
				})
				.catch(() => {
					// Waiting room access for external
					MeetingsApi.getScheduledMeetingName(meetingId)
						.then((resp) => {
							setHasUserDirectAccess(false);
							setMeetingName(resp.name);
						})
						.catch(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND));
				});
		}
	}, [chatsBeNetworkStatus, goToInfoPage, meetingId]);

	return (
		<Container background={'gray0'}>
			{chatsBeNetworkStatus && (
				<AccessMeetingPage hasUserDirectAccess={hasUserDirectAccess} meetingName={meetingName} />
			)}
		</Container>
	);
};

export default AccessMeetingPageView;
