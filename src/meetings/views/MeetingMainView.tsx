/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, ReactElement, Suspense, useContext, useEffect } from 'react';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MeetingsApi } from '../../network';
import useStore from '../../store/Store';
import { BrowserUtils } from '../../utils/BrowserUtils';
import { PiPProvider } from '../components/pictureInPicture/PictureInPictureProvider';
import { MEETINGS_ROUTES, RouterContext, useRouterContextSetup } from '../contexts';

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
		<PiPProvider>
			<LazyMeetingSkeleton />
		</PiPProvider>
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

const MeetingRouter = (): ReactElement => {
	const { route } = useContext(RouterContext);
	switch (route) {
		case MEETINGS_ROUTES.MEETING:
			return <MeetingSkeleton />;
		case MEETINGS_ROUTES.INFO:
			return <InfoPage />;
		case MEETINGS_ROUTES.EXTERNAL_LOGIN:
			return <MeetingExternalAccessPage />;
		case MEETINGS_ROUTES.MEETING_ACCESS_PAGE:
			return <MeetingAccessPageView />;
		case MEETINGS_ROUTES.MAIN:
			return <AccessPageView />;
		default:
			return <div> missing route</div>;
	}
};

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

	const routerContextSetup = useRouterContextSetup();
	return (
		<RouterContext.Provider value={routerContextSetup}>
			<MeetingRouter />
		</RouterContext.Provider>
	);
};

export default MeetingMainView;
