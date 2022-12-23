/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import {
	addRoute,
	addSettingsView,
	getUserAccount,
	getUserSettings,
	Spinner
} from '@zextras/carbonio-shell-ui';
import moment from 'moment-timezone';
import React, { lazy, Suspense, useEffect } from 'react';

import CounterBadgeUpdater from './components/CounterBadgeUpdater';
import SecondaryBarSingleGroupsView from './components/secondaryBar/SecondaryBarSingleGroupsView';
import { CHATS_ROUTE_TEST, PRODUCT_NAME } from './constants/appConstants';
import useRegisterCreationButton from './hooks/useRegisterCreationButton';
import useSnackbarManager from './hooks/useSnackbarManager';
import { RoomsApi, SessionApi } from './network';
import { WebSocketClient } from './network/websocket/WebSocketClient';
import XMPPClient from './network/xmpp/XMPPClient';
import useStore from './store/Store';
import AccessMeetingView from './views/AccessMeetingView';
import ShimmeringConversationView from './views/shimmerViews/ShimmeringConversationView';
import ShimmeringInfoPanelView from './views/shimmerViews/ShimmeringInfoPanelView';

const LazyMainView = lazy(() => import(/* webpackChunkName: "mainView" */ './views/MainView'));

const LazySettingsView = lazy(() =>
	import(/* webpackChunkName: "settingsView" */ './views/SettingsView')
);

const Main = () => (
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

const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<LazySettingsView />
	</Suspense>
);

const SecondaryBar = ({ expanded }) => <SecondaryBarSingleGroupsView expanded={expanded} />;

const initApp = () => {
	const { id, name, displayName } = getUserAccount();
	const { settings } = getUserSettings();

	// STORE: init with user session main infos
	const store = useStore.getState();
	store.setLoginInfo(id, name, displayName);

	// SET TIMEZONE
	settings?.prefs?.zimbraPrefTimeZoneId
		? store.setUserPrefTimezone(settings?.prefs?.zimbraPrefTimeZoneId)
		: store.setUserPrefTimezone(moment.tz.guess());

	// set localStorage for settings
	const notificationManager = JSON.parse(
		window.parent.localStorage.getItem('notificationsSettings') || '{}'
	);
	if (notificationManager === '{}') {
		window.parent.localStorage.setItem(
			'notificationsSettings',
			JSON.stringify({
				DesktopNotifications: true
			})
		);
	}

	Promise.all([SessionApi.getToken(), SessionApi.getCapabilities()])
		.then((resp) => {
			// CHATS BE: get all rooms list
			RoomsApi.listRooms(true, true);

			// XMPP: connection to Mongoose Instant Messaging platform
			const xmppClient = new XMPPClient();
			xmppClient.connect(resp[0].zmToken);
			store.setXmppClient(xmppClient);

			// Web Socket: connection to receive realtime events
			const webSocket = new WebSocketClient();
			store.setWebSocketClient(webSocket);
		})
		.catch(() => store.setChatsBeStatus(false));
};

/*
	TODO: move initApp inside App
	but not now because there is a shell bug that makes mount App more that once
 */
initApp();

export default function App() {
	useEffect(() => {
		addRoute({
			route: CHATS_ROUTE_TEST,
			position: 90,
			visible: true,
			label: PRODUCT_NAME,
			primaryBar: 'Gift',
			appView: Main,
			secondaryBar: SecondaryBar
		});
		addRoute({
			route: 'external',
			visible: false,
			label: PRODUCT_NAME,
			primaryBar: 'coffee',
			appView: () => <AccessMeetingView />,
			standalone: {
				hidePrimaryBar: true,
				hideShellHeader: true,
				allowUnauthenticated: true
			}
		});
		addSettingsView({
			icon: 'Gift',
			route: CHATS_ROUTE_TEST,
			label: PRODUCT_NAME,
			component: SettingsView
		});
	}, []);

	// Register actions on creation button
	const CreationModal = useRegisterCreationButton();

	const Snackbars = useSnackbarManager();

	return (
		<>
			{CreationModal}
			{Snackbars}
			<CounterBadgeUpdater />
		</>
	);
}
