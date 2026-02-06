/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useEffect } from 'react';

import { Container, ModalManager, Spinner } from '@zextras/carbonio-design-system';
import { addSettingsView } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { CHATS_ROUTE, PRODUCT_NAME } from '../constants/appConstants';

const LazySettingsView = lazy(
	() => import(/* webpackChunkName: "settingsView" */ './views/SettingsView')
);

const SettingsView = (): React.JSX.Element => (
	<Suspense
		fallback={
			<Container>
				<Spinner color={'primary'} />
			</Container>
		}
	>
		<ModalManager>
			<LazySettingsView />
		</ModalManager>
	</Suspense>
);

export default function useSettingsApp(): void {
	const { t } = useTranslation();
	useEffect(() => {
		addSettingsView({
			icon: 'WscOutline',
			route: CHATS_ROUTE,
			label: t('label.app_name', PRODUCT_NAME),
			component: SettingsView
		});
	}, [t]);
}
