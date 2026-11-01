/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import {
	getIntegratedFunction,
	registerActions,
	registerComponents,
	removeActions
} from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

import CopyRoomWidget from './copyRoomIntegration/CopyRoomWidget';
import {
	toWidgetAction,
	WIDGET_ACTION_TYPE,
	type DashboardWidgetAction
} from './dashboardWidgets/dashboardWidgetTypes';
import { unreadChatsWidget } from './dashboardWidgets/unreadChatsDefinition';
import SelectVirtualRoomWidgetComponent from './virtualRoomIntegration/SelectVirtualRoomWidget';
import { QUOTA_CHANGED_EVENT } from '../constants/appConstants';
import { getAttribute } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';

export default function useIntegrationsApp(): void {
	const [t] = useTranslation();
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

	// Widgets exposed to carbonio-dashboard-ui
	useEffect(() => {
		registerActions<DashboardWidgetAction>({
			id: unreadChatsWidget.id,
			type: WIDGET_ACTION_TYPE,
			action: () =>
				toWidgetAction({
					...unreadChatsWidget,
					label: t('dashboard.unreadChats.title', 'Unread messages')
				})
		});
		return (): void => removeActions(unreadChatsWidget.id);
	}, [t]);

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
