/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, ReactElement, Suspense, useEffect } from 'react';

import { createMemoryHistory } from 'history';
import { Route, Router, Switch } from 'react-router-dom';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import useDarkReader from '../../hooks/useDarkReader';
import { MEETINGS_ROUTES, ROUTES } from '../../hooks/useRouting';
import useStore from '../../store/Store';

const LazyAccessPageView = lazy(
	() => import(/* webpackChunkName: "MeetingAccessPageView" */ './AccessPage')
);

const LazyMeetingSkeleton = lazy(
	() => import(/* webpackChunkName: "MeetingSkeleton" */ './MeetingSkeleton')
);

const LazyInfoPage = lazy(() => import(/* webpackChunkName: "InfoPage" */ './InfoPage'));

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

const MeetingMainView = (): ReactElement => {
	const history = createMemoryHistory();
	const setCustomLogo = useStore((store) => store.setCustomLogo);

	const { darkReaderStatus, enableDarkReader, disableDarkReader } = useDarkReader();

	useEffect(() => {
		fetch('/zx/login/v3/config')
			.then((response) => response.json())
			.then((data) => {
				const clientLogo = data.carbonioWebUiAppLogo ? data.carbonioWebUiAppLogo : false;
				setCustomLogo(clientLogo);
			})
			.catch((reason) => {
				setCustomLogo(false);
				console.log(reason);
			});
	}, [setCustomLogo]);

	useEffect(() => {
		if (!darkReaderStatus) {
			enableDarkReader();
		}
		return (): void => {
			if (!darkReaderStatus) {
				disableDarkReader();
			}
		};
	}, [darkReaderStatus, disableDarkReader, enableDarkReader]);

	return (
		<Router history={history}>
			<Switch>
				<Route exact path={ROUTES.MAIN} component={AccessPageView} />
				<Route exact path={MEETINGS_ROUTES.MEETING} component={MeetingSkeleton} />
				<Route exact path={MEETINGS_ROUTES.INFO} component={InfoPage} />
			</Switch>
		</Router>
	);
};

export default MeetingMainView;
