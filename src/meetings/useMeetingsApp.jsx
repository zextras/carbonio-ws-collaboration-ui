/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute, Spinner } from '@zextras/carbonio-shell-ui';
import React, { lazy, Suspense, useEffect } from 'react';

import MeetingsSecondaryBar from './components/secondaryBar/MeetingsSecondaryBar';
import ExternalMainView from './views/ExternalMainView';
import { MEETINGS_NAME, MEETINGS_ROUTE } from '../constants/appConstants';

const LazyMeetingsMainView = lazy(() =>
	import(/* webpackChunkName: "mainView" */ './views/MainView')
);

const MeetingsMain = () => (
	<Suspense fallback={<Spinner />}>
		<LazyMeetingsMainView />
	</Suspense>
);

const SecondaryBar = ({ expanded }) => <MeetingsSecondaryBar expanded={expanded} />;

export default function useMeetingsApp() {
	useEffect(() => {
		addRoute({
			route: MEETINGS_ROUTE,
			position: 90,
			visible: true,
			label: MEETINGS_NAME,
			primaryBar: 'VideoOutline',
			appView: MeetingsMain,
			secondaryBar: SecondaryBar
		});
		addRoute({
			route: 'external',
			visible: false,
			label: MEETINGS_NAME,
			primaryBar: 'TeamOutline',
			appView: ExternalMainView,
			standalone: {
				hidePrimaryBar: true,
				hideShellHeader: true,
				allowUnauthenticated: true
			}
		});
	}, []);
}
