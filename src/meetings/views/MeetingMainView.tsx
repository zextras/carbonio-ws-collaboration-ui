/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, ReactElement, Suspense, useEffect } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MEETINGS_ROUTES, ROUTES } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import useStore from '../../store/Store';
import { BrowserUtils } from '../../utils/BrowserUtils';

const LazyAccessPageView = lazy(
	() => import(/* webpackChunkName: "MeetingAccessPage" */ './AccessPage')
);

const LazyMeetingSkeleton = lazy(() => {
	if (BrowserUtils.isMobile()) {
		return import(/* webpackChunkName: "MeetingSkeletonMobile" */ './mobile/MeetingSkeletonMobile');
	}
	return import(/* webpackChunkName: "MeetingSkeleton" */ './MeetingSkeleton');
});

const LazyInfoPage = lazy(() => import(/* webpackChunkName: "InfoPage" */ './InfoPage'));

const LazyMeetingExternalAccessPage = lazy(() => {
	if (BrowserUtils.isMobile()) {
		return import(
			/* webpackChunkName: "MeetingExternalAccessMobilePage" */ './mobile/MeetingExternalAccessMobilePage'
		);
	}
	return import(
		/* webpackChunkName: "MeetingExternalAccessPage" */ '../components/meetingAccessPoint/MeetingExternalAccessPage'
	);
});

const LazyMeetingAccessPage = lazy(() => {
	if (BrowserUtils.isMobile()) {
		return import(
			/* webpackChunkName: "MeetingAccessMobilePageView" */ './mobile/MeetingAccessMobilePage'
		);
	}
	return import(/* webpackChunkName: "MeetingAccessPage" */ './MeetingAccessPage');
});

const AccessPageView = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyAccessPageView />
	</Suspense>
);

const MeetingSkeleton = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyMeetingSkeleton />
	</Suspense>
);

const InfoPage = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyInfoPage />
	</Suspense>
);

const MeetingExternalAccessPage = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyMeetingExternalAccessPage />
	</Suspense>
);

const MeetingAccessPageView = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyMeetingAccessPage />
	</Suspense>
);

const MeetingMainView = (): ReactElement => {
	const setCustomLogo = useStore((store) => store.setCustomLogo);

	useEffect(() => {
		MeetingsApi.authLogin()
			.then((data) => {
				const clientLogo = data.carbonioWebUiAppLogo ?? false;
				setCustomLogo(clientLogo);
			})
			.catch((reason) => {
				setCustomLogo(false);
				console.log(reason);
			});
	}, [setCustomLogo]);

	return (
		<MemoryRouter>
			<Routes>
				<Route path={ROUTES.MAIN} element={<AccessPageView />} />
				<Route path={MEETINGS_ROUTES.MEETING} element={<MeetingSkeleton />} />
				<Route path={MEETINGS_ROUTES.MEETING_ACCESS_PAGE} element={<MeetingAccessPageView />} />
				<Route path={MEETINGS_ROUTES.EXTERNAL_LOGIN} element={<MeetingExternalAccessPage />} />
				<Route path={MEETINGS_ROUTES.INFO} element={<InfoPage />} />
			</Routes>
		</MemoryRouter>
	);
};

export default MeetingMainView;
