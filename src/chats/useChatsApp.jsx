/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, Suspense, useEffect } from 'react';

import { Container, ModalManager } from '@zextras/carbonio-design-system';
import { addRoute, addSettingsView, Spinner } from '@zextras/carbonio-shell-ui';

import ConnectionSnackbarManager from './components/ConnectionSnackbarManager';
import SecondaryBarSingleGroupsView from './components/secondaryBar/SecondaryBarSingleGroupsView';
import { LogoBeta, LogoSettingsBeta } from './LogoBeta';
import ShimmeringConversationView from './views/shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './views/shimmerViews/ShimmeringInfoPanelView';
import { CHATS_ROUTE, PRODUCT_NAME } from '../constants/appConstants';

const LazyMainView = lazy(() => import(/* webpackChunkName: "mainView" */ './views/MainView'));

const LazySettingsView = lazy(
	() => import(/* webpackChunkName: "settingsView" */ './views/SettingsView')
);
const ChatsMain = () => (
	<Suspense
		fallback={
			<Container mainAlignment="flex-start" orientation="horizontal">
				<ShimmeringConversationView />
				<ShimmeringInfoPanelView />
			</Container>
		}
	>
		<ModalManager>
			<ConnectionSnackbarManager />
			<LazyMainView />
		</ModalManager>
	</Suspense>
);
const SecondaryBar = (props) => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<SecondaryBarSingleGroupsView {...props} />
		</ModalManager>
	</Suspense>
);

const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazySettingsView />
		</ModalManager>
	</Suspense>
);
export default function useChatsApp() {
	useEffect(() => {
		addRoute({
			route: CHATS_ROUTE,
			visible: true,
			label: PRODUCT_NAME,
			primaryBar: LogoBeta,
			appView: ChatsMain,
			secondaryBar: SecondaryBar
		});
		addSettingsView({
			icon: LogoSettingsBeta,
			route: CHATS_ROUTE,
			label: PRODUCT_NAME,
			component: SettingsView
		});
	}, []);
}
