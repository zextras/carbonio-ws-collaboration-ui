/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
import moment from 'moment-timezone';
import React, { useEffect } from 'react';

import CounterBadgeUpdater from './components/CounterBadgeUpdater';
import useRegisterCreationButton from './hooks/useRegisterCreationButton';
import useSnackbarManager from './hooks/useSnackbarManager';
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
			MeetingsApi.listMeetings();
			// Web Socket: connection to receive realtime events
			const webSocket = new WebSocketClient();
			store.setWebSocketClient(webSocket);
		})
		.catch(() => store.setChatsBeStatus(false));
};

export default function App() {
	useEffect(() => {
		initApp();
	}, []);

	useChatsRoute();
	useMeetingsRoute();

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
