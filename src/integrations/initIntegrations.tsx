/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { getIntegratedFunction, registerComponents } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import CopyRoomWidget from './copyRoomIntegration/CopyRoomWidget';
import SelectVirtualRoomWidgetComponent from './virtualRoomIntegration/SelectVirtualRoomWidget';
import { QUOTA_CHANGED_EVENT } from '../constants/appConstants';
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

	useEffect(() => {
		const debouncedRefreshQuota = debounce(() => {
			const [refreshQuota, isAvailable] = getIntegratedFunction('storages-refresh-quota');
			if (isAvailable) {
				refreshQuota();
			}
		}, 2000);

		const handler = (): void => {
			debouncedRefreshQuota();
		};

		window.addEventListener(QUOTA_CHANGED_EVENT, handler);
		return (): void => {
			window.removeEventListener(QUOTA_CHANGED_EVENT, handler);
			debouncedRefreshQuota.cancel();
		};
	}, []);
}
