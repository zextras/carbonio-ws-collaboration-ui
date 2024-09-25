/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { lazy } from 'react';

import { BrowserUtils } from '../../utils/BrowserUtils';

export const LazyAccessPageView = lazy(
	() => import(/* webpackChunkName: "MeetingAccessPageView" */ './AccessPage')
);

export const LazyExternalAccessPage = lazy(() => {
	if (BrowserUtils.isMobile()) {
		return import(
			/* webpackChunkName: "ExternalAccessMobilePage" */ './mobile/MeetingExternalAccessMobilePage'
		);
	}
	return import(
		/* webpackChunkName: "ExternalAccessPage" */ '../components/meetingAccessPoint/MeetingExternalAccessPage'
	);
});

export const LazyMeetingAccessPageView = lazy(
	() => import(/* webpackChunkName: "MeetingAccessPageView" */ './MeetingAccessPageView')
);

export const LazyMeetingSkeleton = lazy(
	() => import(/* webpackChunkName: "MeetingSkeleton" */ './MeetingSkeleton')
);

export const LazyInfoPage = lazy(() => {
	if (BrowserUtils.isMobile()) {
		return import(/* webpackChunkName: "InfoMobilePage" */ './mobile/InfoMobilePage');
	}
	return import(/* webpackChunkName: "InfoPage" */ './InfoPage');
});
