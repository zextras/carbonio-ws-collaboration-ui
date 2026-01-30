/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useEffect, useMemo } from 'react';

import { useAuthenticated } from '@zextras/carbonio-shell-ui';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MEETINGS_PATH } from '../../constants/appConstants';
import useRouting from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import { PAGE_INFO_TYPE } from '../contexts/routerContext';

const AccessPage = (): ReactElement => {
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);

	const { goToInfoPage, goToExternalLoginPage, goToMeetingAccessPage } = useRouting();
	const authenticated = useAuthenticated();

	useEffect(() => {
		const isMobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
				navigator.userAgent
			);

		if (isMobile) {
			const deepLink = `carbonio-chats://meeting?url=${encodeURIComponent(window.location.href)}`;
			window.location.replace(deepLink);
		}
	}, []);

	useEffect(() => {
		if (!authenticated) {
			MeetingsApi.getScheduledMeetingName(meetingId)
				.then(() => {
					goToExternalLoginPage();
				})
				.catch(() => {
					goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
				});
		} else {
			goToMeetingAccessPage();
		}
	}, [authenticated, goToExternalLoginPage, goToInfoPage, goToMeetingAccessPage, meetingId]);

	return <ShimmerEntryMeetingView />;
};

export default AccessPage;
