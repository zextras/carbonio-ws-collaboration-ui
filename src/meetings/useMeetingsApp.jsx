/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Spinner } from '@zextras/carbonio-design-system';
import { addRoute } from '@zextras/carbonio-shell-ui';
import React, { lazy, Suspense, useEffect } from 'react';

import { MEETINGS_NAME } from '../constants/appConstants';

const LazyExternalMainView = lazy(() =>
	import(/* webpackChunkName: "mainView" */ './views/ExternalMainView')
);

const ExternalMain = () => (
	<Suspense fallback={<Spinner />}>
		<LazyExternalMainView />
	</Suspense>
);

export default function useMeetingsApp() {
	useEffect(() => {
		addRoute({
			route: 'external',
			visible: false,
			label: MEETINGS_NAME,
			primaryBar: 'TeamOutline',
			appView: ExternalMain,
			standalone: {
				hidePrimaryBar: true,
				hideShellHeader: true,
				allowUnauthenticated: true
			}
		});
		// addRoute({
		// 	route: MEETINGS_ROUTE,
		// 	position: 90,
		// 	visible: true,
		// 	label: MEETINGS_NAME,
		// 	primaryBar: 'VideoOutline',
		// 	appView: MeetingsMain,
		// 	secondaryBar: SecondaryBar
		// });
	}, []);
}
