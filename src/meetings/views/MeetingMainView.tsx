/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, Suspense, useEffect } from 'react';

import { createMemoryHistory } from 'history';
import { Route, Router, Switch } from 'react-router-dom';

import {
	LazyAccessPageView,
	LazyExternalAccessPage,
	LazyInfoPage,
	LazyMeetingAccessPageView,
	LazyMeetingSkeleton
} from './LazyLoadedPages';
import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MEETINGS_ROUTES, ROUTES } from '../../hooks/useRouting';
import { MeetingsApi } from '../../network';
import useStore from '../../store/Store';

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
		<LazyExternalAccessPage />
	</Suspense>
);

const MeetingAccessPageView = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyMeetingAccessPageView />
	</Suspense>
);

const MeetingMainView = (): ReactElement => {
	const history = createMemoryHistory();
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
		<Router history={history}>
			<Switch>
				<Route exact path={ROUTES.MAIN} component={AccessPageView} />
				<Route exact path={MEETINGS_ROUTES.MEETING} component={MeetingSkeleton} />
				<Route exact path={MEETINGS_ROUTES.MEETING_ACCESS_PAGE} component={MeetingAccessPageView} />
				<Route exact path={MEETINGS_ROUTES.EXTERNAL_LOGIN} component={MeetingExternalAccessPage} />
				<Route exact path={MEETINGS_ROUTES.INFO} component={InfoPage} />
			</Switch>
		</Router>
	);
};

export default MeetingMainView;
