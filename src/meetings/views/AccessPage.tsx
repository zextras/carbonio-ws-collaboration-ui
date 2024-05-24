/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useMemo } from 'react';

import { useAuthenticated } from '@zextras/carbonio-shell-ui';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MEETINGS_PATH } from '../../constants/appConstants';
import useRouting, { PAGE_INFO_TYPE } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';

const AccessPage = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const { goToInfoPage, goToExternalLoginPage, goToMeetingAccessPage } = useRouting();
	const authenticated = useAuthenticated();

	useEffect(() => {
		if (!authenticated) {
			MeetingsApi.getScheduledMeetingName(meetingId)
				.then(() => {
					goToExternalLoginPage();
				})
				.catch((err) => {
					console.error(err);
					goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
				});
		} else {
			goToMeetingAccessPage();
		}
	}, [authenticated, goToExternalLoginPage, goToInfoPage, goToMeetingAccessPage, meetingId]);

	return <ShimmerEntryMeetingView />;
};

export default AccessPage;
