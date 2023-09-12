/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { disable, enable } from 'darkreader';
import { createMemoryHistory } from 'history';
import React, { lazy, ReactElement, Suspense, useEffect } from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import ShimmerEntryMeetingView from './shimmers/ShimmerEntryMeetingView';
import { MEETINGS_ROUTES, ROUTES } from '../../hooks/useRouting';
import useStore from '../../store/Store';

const LazyAccessMeetingPageView = lazy(
	() => import(/* webpackChunkName: "AccessMeetingPageView" */ './AccessMeetingPageView')
);

const LazyMeetingSkeleton = lazy(
	() => import(/* webpackChunkName: "MeetingSkeleton" */ './MeetingSkeleton')
);

const LazyInfoPage = lazy(() => import(/* webpackChunkName: "InfoPage" */ './InfoPage'));

const AccessMeetingPageView = (): ReactElement => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyAccessMeetingPageView />
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

// TODO WITH NEW SHELL: remove
const MeetingTempGlobalStyle = createGlobalStyle`
	[data-testid="MainHeaderContainer"], .hjBWLK {
	  display: none;
	}
	.ddayvo {
	  max-height: 100%;
	}
`;

const ExternalMainView = (): ReactElement => {
	const history = createMemoryHistory();
	const setCustomLogo = useStore((store) => store.setCustomLogo);

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
		enable(
			{
				sepia: 0
			},
			{
				ignoreImageAnalysis: ['.no-dr-invert *'],
				invert: [],
				css: `
		.tox, .force-white-bg, .tox-swatches-menu, .tox .tox-edit-area__iframe {
			background-color: #fff !important;
			background: #fff !important;
		}
	`,
				ignoreInlineStyle: ['.tox-menu *'],
				disableStyleSheetsProxy: false
			}
		);
		return () => disable();
	}, []);

	return (
		<Router history={history}>
			<MeetingTempGlobalStyle />
			<Switch>
				<Route exact path={ROUTES.MAIN} component={AccessMeetingPageView} />
				<Route exact path={MEETINGS_ROUTES.MEETING} component={MeetingSkeleton} />
				<Route exact path={MEETINGS_ROUTES.INFO} component={InfoPage} />
			</Switch>
		</Router>
	);
};

export default ExternalMainView;
