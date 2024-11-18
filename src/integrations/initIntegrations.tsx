/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { registerComponents } from '@zextras/carbonio-shell-ui';

import CopyRoomWidget from './copyRoomIntegration/CopyRoomWidget';
import SelectVirtualRoomWidgetComponent from './virtualRoomIntegration/SelectVirtualRoomWidget';

export default function useIntegrationsApp(): void {
	useEffect(() => {
		registerComponents({
			id: 'wsc-room-selector',
			component: SelectVirtualRoomWidgetComponent
		});
		registerComponents({
			id: 'wsc-copy-room',
			component: CopyRoomWidget
		});
	}, []);
}
