/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useEffect } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { addSettingsView, Spinner } from '@zextras/carbonio-shell-ui';

import { LogoSettingsBeta } from '../chats/LogoBeta';
import { CHATS_ROUTE, PRODUCT_NAME } from '../constants/appConstants';

const LazySettingsView = lazy(
	() => import(/* webpackChunkName: "settingsView" */ './views/SettingsView')
);

const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazySettingsView />
		</ModalManager>
	</Suspense>
);

export default function useSettingsApp() {
	useEffect(() => {
		addSettingsView({
			icon: LogoSettingsBeta,
			route: CHATS_ROUTE,
			label: PRODUCT_NAME,
			component: SettingsView
		});
	}, []);
}
