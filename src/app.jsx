/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
import moment from 'moment-timezone';
import React from 'react';

import ConnectionSnackbarManager from './components/ConnectionSnackbarManager';
import CounterBadgeUpdater from './components/CounterBadgeUpdater';
import RegisterCreationButton from './components/RegisterCreationButton';
import { MeetingsApi, RoomsApi, SessionApi } from './network';
import { WebSocketClient } from './network/websocket/WebSocketClient';
import XMPPClient from './network/xmpp/XMPPClient';
import useStore from './store/Store';
import useChatsRoute from './useChatsRoute';
import useMeetingsRoute from './useMeetingsRoute';

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

	// Create and set into store XMPPClient and WebSocketClient instances
	// to avoid errors when views are rendered
	const xmppClient = new XMPPClient();
	store.setXmppClient(xmppClient);
	const webSocket = new WebSocketClient();
	store.setWebSocketClient(webSocket);

	Promise.all([SessionApi.getToken(), SessionApi.getCapabilities()])
		.then((resp) => {
			// CHATS BE: get all rooms list
			RoomsApi.listRooms(true, true)
				.then(() => {
					// Init xmppClient and webSocket after roomList request to avoid missing data (specially for the inbox request)
					xmppClient.connect(resp[0].zmToken);
					webSocket.connect();
				})
				.catch(() => store.setChatsBeStatus(false));
			MeetingsApi.listMeetings();
		})
		.catch(() => store.setChatsBeStatus(false));
};

/*
	TODO: move initApp inside App
	but not now because there is a shell bug that makes mount App more that once
 */
initApp();

export default function App() {
	useChatsRoute();
	useMeetingsRoute();

	return (
		<>
			<RegisterCreationButton />
			<ConnectionSnackbarManager />
			<CounterBadgeUpdater />
		</>
	);
}
