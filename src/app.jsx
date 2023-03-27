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
import { CHATS_ROUTE, PRODUCT_NAME } from './constants/appConstants';
import useRegisterCreationButton from './hooks/useRegisterCreationButton';
import useSnackbarManager from './hooks/useSnackbarManager';
import { LogoBeta, LogoSettingsBeta } from './LogoBeta';
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

	// SET TIMEZONE and LOCALE
	settings?.prefs?.zimbraPrefTimeZoneId
		? store.setUserPrefTimezone(settings?.prefs?.zimbraPrefTimeZoneId)
		: store.setUserPrefTimezone(moment.tz.guess());
	if (settings?.prefs?.zimbraPrefLocale) {
		moment.locale(settings.prefs.zimbraPrefLocale);
	}

	Promise.all([SessionApi.getToken(), SessionApi.getCapabilities()])
		.then((resp) => {
			// CHATS BE: get all rooms list
			RoomsApi.listRooms(true, true)
				.then(() => {
					// XMPP: connection to Mongoose Instant Messaging platform
					// Init xmppClient after roomList request to avoid missing data after inboxMessages
					// main scenario when requesting history of a room and without this check previously
					// an error for missing clearedAt was returned
					const xmppClient = new XMPPClient();
					xmppClient.connect(resp[0].zmToken);
					store.setXmppClient(xmppClient);
				})
				.catch(() => store.setChatsBeStatus(false));
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
			route: CHATS_ROUTE,
			visible: true,
			label: PRODUCT_NAME,
			primaryBar: LogoBeta,
			appView: Main,
			secondaryBar: SecondaryBar
		});
		addRoute({
			route: 'external',
			visible: false,
			label: PRODUCT_NAME,
			primaryBar: 'TeamOutline',
			appView: () => <AccessMeetingView />,
			standalone: {
				hidePrimaryBar: true,
				hideShellHeader: true,
				allowUnauthenticated: true
			}
		});
		addSettingsView({
			icon: LogoSettingsBeta,
			route: CHATS_ROUTE,
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
