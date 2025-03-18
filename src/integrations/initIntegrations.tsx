/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { registerComponents } from '@zextras/carbonio-shell-ui';

import CopyRoomWidget from './copyRoomIntegration/CopyRoomWidget';
import SelectVirtualRoomWidgetComponent from './virtualRoomIntegration/SelectVirtualRoomWidget';
import { getAttribute } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';

export default function useIntegrationsApp(): void {
	const videoCallEnabled = useStore((store) => getAttribute(store, 'videoCallEnabled'));

	useEffect(() => {
		if (videoCallEnabled) {
			registerComponents({
				id: 'wsc-room-selector',
				component: SelectVirtualRoomWidgetComponent
			});
		}
	}, [videoCallEnabled]);

	useEffect(() => {
		registerComponents({
			id: 'wsc-copy-room',
			component: CopyRoomWidget
		});
	}, []);
}
