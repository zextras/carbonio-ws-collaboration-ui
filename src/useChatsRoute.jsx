/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { addRoute, addSettingsView, Spinner } from '@zextras/carbonio-shell-ui';
import React, { lazy, Suspense, useEffect } from 'react';

import SecondaryBarSingleGroupsView from './components/secondaryBar/SecondaryBarSingleGroupsView';
import { CHATS_ROUTE, PRODUCT_NAME } from './constants/appConstants';
import { LogoBeta, LogoSettingsBeta } from './LogoBeta';
import ShimmeringConversationView from './views/chats/shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './views/chats/shimmerViews/ShimmeringInfoPanelView';

const LazyMainView = lazy(() =>
	import(/* webpackChunkName: "mainView" */ './views/chats/MainView')
);

const LazySettingsView = lazy(() =>
	import(/* webpackChunkName: "settingsView" */ './views/SettingsView')
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
		<LazyMainView />
	</Suspense>
);
const SecondaryBar = ({ expanded }) => <SecondaryBarSingleGroupsView expanded={expanded} />;

const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<LazySettingsView />
	</Suspense>
);
export default function useChatsRoute() {
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
