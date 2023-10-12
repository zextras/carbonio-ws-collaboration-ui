/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute } from '@zextras/carbonio-shell-ui';
import React, { lazy, Suspense, useEffect } from 'react';

import ShimmerEntryMeetingView from './views/shimmers/ShimmerEntryMeetingView';
import { MEETINGS_NAME, MEETINGS_ROUTE } from '../constants/appConstants';

const LazyMeetingMainView = lazy(() =>
	import(/* webpackChunkName: "mainView" */ './views/MeetingMainView')
);

const MeetingMain = () => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyMeetingMainView />
	</Suspense>
);

export default function useMeetingsApp() {
	useEffect(() => {
		addRoute({
			route: MEETINGS_ROUTE,
			visible: false,
			label: MEETINGS_NAME,
			primaryBar: 'TeamOutline',
			appView: MeetingMain,
			focusMode: true
		});
	}, []);
}
