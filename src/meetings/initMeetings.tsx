/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, Suspense, useEffect } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { addRoute } from '@zextras/carbonio-shell-ui';

import DownlinkSnackbarManager from './components/DownlinkSnackbarManager';
import ShimmerEntryMeetingView from './views/shimmers/ShimmerEntryMeetingView';
import ConnectionSnackbarManager from '../chats/components/ConnectionSnackbarManager';
import PreviewNavigationManager from '../chats/components/PreviewNavigationManager';
import { MEETINGS_NAME, MEETINGS_ROUTE } from '../constants/appConstants';
import { installStreamDebugHook } from '../utils/debugStreamCaps';

const LazyMeetingMainView = lazy(
	() => import(/* webpackChunkName: "mainView" */ './views/MeetingMainView')
);

const MeetingMain = (): React.JSX.Element => (
	<Suspense fallback={<ShimmerEntryMeetingView />}>
		<ModalManager>
			<ConnectionSnackbarManager />
			<DownlinkSnackbarManager />
			<PreviewNavigationManager />
			<LazyMeetingMainView />
		</ModalManager>
	</Suspense>
);

export default function useMeetingsApp(): void {
	useEffect(() => {
		// DEBUG-ONLY: expose window.wscStreamDebug for manual stream-quality hard-caps. Inert until used.
		installStreamDebugHook();
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
