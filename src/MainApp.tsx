/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect } from 'react';

import { getUserAccount, useAuthenticated, useUserSettings } from '@zextras/carbonio-shell-ui';
import { gte } from 'semver';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import RegisterVirtualRoomCreationButton from './chats/components/RegisterVirtualRoomCreationButton';
import initChats from './chats/initChats';
import initIntegrations from './integrations/initIntegrations';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import initMeetings from './meetings/initMeetings';
import { getCapabilities, getToken, listMeetings, listRooms } from './network';
import { wsClient } from './network/websocket/WebSocketClient';
import { xmppClient } from './network/xmpp/XMPPClient';
import WaitingListSnackbar from './settings/components/WaitingListSnackbar';
import initSettings from './settings/initSettings';
import useStore from './store/Store';
import { setDateDefault } from './utils/dateUtils';

export default function MainApp(): React.JSX.Element {
	const setLoginInfo = useStore((state) => state.setLoginInfo);
	const setAttributes = useStore((state) => state.setAttributes);
	const setChatsBeStatus = useStore((state) => state.setChatsBeStatus);
	const setSupportedVersions = useStore((state) => state.setSupportedVersions);

	const authenticated = useAuthenticated();
	const { prefs, attrs } = useUserSettings();

	useEffect(() => {
		setSupportedVersions([
			'1.6.12',
			'1.6.11',
			'1.6.10',
			'1.6.9',
			'1.6.8',
			'1.6.7',
			'1.6.6',
			'1.6.5',
			'1.6.4',
			'1.6.3',
			'1.6.2',
			'1.6.1',
			'1.6.0'
		]);
	}, [setSupportedVersions]);

	// STORE: init with user session main infos
	useEffect(() => {
		const userAccount = getUserAccount();
		if (authenticated && userAccount) {
			setLoginInfo({
				id: userAccount.id,
				name: userAccount.name,
				displayName: userAccount.displayName
			});
		}
	}, [setLoginInfo, authenticated]);

	// SET TIMEZONE and LOCALE
	useEffect(() => {
		if (authenticated) setDateDefault(prefs?.zimbraPrefLocale);
	}, [prefs, authenticated]);

	// NETWORKS: init XMPP and WebSocket clients
	const connect = useCallback(() => {
		getToken()
			.then((resp) => {
				Promise.all([listRooms(true, true), listMeetings()])
					.then(() => {
						const version = useStore.getState().session.apiVersion;
						if (version && gte(version, '1.6.8')) {
							getCapabilities().catch(() => {
								setAttributes(attrs);
							});
						} else {
							setAttributes(attrs);
						}
						setChatsBeStatus(true);
						// Init xmppClient and webSocket after roomList request to avoid missing data (specially for the inbox request)
						xmppClient.connect(resp.zmToken);
						wsClient.connect();
					})
					.catch(() => setChatsBeStatus(false));
			})
			.catch(() => {
				setChatsBeStatus(false);
			});
	}, [setChatsBeStatus, setAttributes, attrs]);

	useEffect(() => {
		if (authenticated) {
			connect();
		}
	}, [authenticated, connect]);

	initChats();
	initMeetings();
	initSettings();
	initIntegrations();

	return (
		<>
			<RegisterCreationButton />
			<RegisterVirtualRoomCreationButton />
			<CounterBadgeUpdater />
			<MeetingNotificationHandler />
			<WaitingListSnackbar />
		</>
	);
}
