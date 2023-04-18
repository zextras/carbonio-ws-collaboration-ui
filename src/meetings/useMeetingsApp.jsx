/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute } from '@zextras/carbonio-shell-ui';
import { useEffect } from 'react';

import ExternalMainView from './views/ExternalMainView';
import { MEETINGS_NAME } from '../constants/appConstants';

export default function useMeetingsApp() {
	useEffect(() => {
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
