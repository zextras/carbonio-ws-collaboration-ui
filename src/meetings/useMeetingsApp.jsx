/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, Suspense, useEffect } from 'react';

import { addRoute } from '@zextras/carbonio-shell-ui';

import ShimmerEntryMeetingView from './views/shimmers/ShimmerEntryMeetingView';
import { MEETINGS_NAME, MEETINGS_ROUTE } from '../constants/appConstants';

const LazyExternalMainView = lazy(() =>
	import(/* webpackChunkName: "mainView" */ './views/ExternalMainView')
);

const ExternalMain = () => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<LazyExternalMainView />
	</Suspense>
);

export default function useMeetingsApp() {
	useEffect(() => {
		addRoute({
			route: MEETINGS_ROUTE,
			visible: false,
			label: MEETINGS_NAME,
			primaryBar: 'TeamOutline',
			appView: ExternalMain,
			focusMode: true
		});
	}, []);
}
