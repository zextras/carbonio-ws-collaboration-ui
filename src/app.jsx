/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import useChatsApp from './chats/useChatsApp';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import useMeetingsApp from './meetings/useMeetingsApp';
import { MeetingsApi, RoomsApi, SessionApi } from './network';
import { WebSocketClient } from './network/websocket/WebSocketClient';
import XMPPClient from './network/xmpp/XMPPClient';
import useStore from './store/Store';
import { setDateDefault } from './utils/dateUtils';

export default function App() {
	const setLoginInfo = useStore((state) => state.setLoginInfo);
	const setXmppClient = useStore((state) => state.setXmppClient);
	const setWebSocketClient = useStore((state) => state.setWebSocketClient);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);

	const userAccount = useUserAccount();
	const { prefs } = useUserSettings();

	// STORE: init with user session main infos
	useEffect(
		() => setLoginInfo(userAccount.id, userAccount.name, userAccount.displayName),
		[setLoginInfo, userAccount]
	);

	// SET TIMEZONE and LOCALE
	useEffect(() => {
		setDateDefault(prefs?.zimbraPrefTimeZoneId, prefs?.zimbraPrefLocale);
	}, [prefs]);

	// NETWORKS: init XMPP and WebSocket clients
	useEffect(() => {
		const xmppClient = new XMPPClient();
		setXmppClient(xmppClient);
		const webSocket = new WebSocketClient();
		setWebSocketClient(webSocket);

		Promise.all([
			SessionApi.getToken(),
			SessionApi.getCapabilities(),
			RoomsApi.listRooms(true, true),
			MeetingsApi.listMeetings()
		])
			.then((resp) => {
				setChatsBeStatus(true);

				// Init xmppClient and webSocket after roomList request to avoid missing data (specially for the inbox request)
				xmppClient.connect(resp[0].zmToken);
				webSocket.connect();
			})
			.catch(() => setChatsBeStatus(false));
	}, [setChatsBeStatus, setWebSocketClient, setXmppClient]);

	useChatsApp();
	useMeetingsApp();

	return (
		<>
			<RegisterCreationButton />
			<CounterBadgeUpdater />
			<MeetingNotificationHandler />
		</>
	);
}
