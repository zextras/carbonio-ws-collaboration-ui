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
import { MEETINGS_ROUTES, RouterContext, useRouterContextSetup } from '../contexts/routerContext';

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
		/* webpackChunkName: "MeetingExternalAccessPage" */ '../components/meetingAccessPoint/externalAccess/MeetingExternalAccessPage'
	);
});

const LazyMeetingAccessPage = lazy(
	() => import(/* webpackChunkName: "MeetingAccessPage" */ './MeetingAccessPage')
);

const MeetingRouter = (): ReactElement => {
	const { route } = useContext(RouterContext);

	const routes: Record<string, ReactElement> = {
		[MEETINGS_ROUTES.MAIN]: <LazyAccessPageView />,
		[MEETINGS_ROUTES.MEETING_ACCESS_PAGE]: <LazyMeetingAccessPage />,
		[MEETINGS_ROUTES.EXTERNAL_ACCESS_PAGE]: <LazyMeetingExternalAccessPage />,
		[MEETINGS_ROUTES.MEETING]: (
			<PiPProvider>
				<LazyMeetingSkeleton />
			</PiPProvider>
		),
		[MEETINGS_ROUTES.INFO]: <LazyInfoPage />
	};

	return <Suspense fallback={<ShimmerEntryMeetingView />}>{routes[route]}</Suspense>;
};

const MeetingMainView = (): ReactElement => {
	const setCustomLogo = useStore((store) => store.setCustomLogo);

	useEffect(() => {
		MeetingsApi.getLoginConfig().then((data) => {
			const clientLogo = data.carbonioWebUiAppLogo || undefined;
			if (clientLogo) {
				setCustomLogo(clientLogo);
			}
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
