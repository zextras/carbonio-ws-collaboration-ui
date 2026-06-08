/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import { getUserAccount, useAuthenticated, useUserSettings } from '@zextras/carbonio-shell-ui';
import { gte } from 'semver';

import CounterBadgeUpdater from './chats/components/CounterBadgeUpdater';
import RegisterCreationButton from './chats/components/RegisterCreationButton';
import RegisterVirtualRoomCreationButton from './chats/components/RegisterVirtualRoomCreationButton';
import initChats from './chats/initChats';
import initIntegrations from './integrations/initIntegrations';
import MeetingNotificationHandler from './meetings/components/MeetingNotificationsHandler';
import initMeetings from './meetings/initMeetings';
import { ChatApi, getCapabilities, getToken, listMeetings, listRooms } from './network';
import { hydrateStoreFromInbox } from './network/messaging/RestBackendBootstrap';
import { RestMessagingBackend } from './network/messaging/RestMessagingBackend';
import { XmppMessagingBackend } from './network/messaging/XmppMessagingBackend';
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
	const hasConnectedRef = useRef(false);

	useEffect(() => {
		setSupportedVersions([
			'2.0.0',
			'1.7.0',
			'1.6.13',
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
			setAttributes(attrs);
		}
	}, [setLoginInfo, authenticated, setAttributes, attrs]);

	// SET TIMEZONE and LOCALE
	useEffect(() => {
		if (authenticated) setDateDefault(prefs?.zimbraPrefLocale);
	}, [prefs, authenticated]);

	// NETWORKS: detect backend type via /inbox, then load accordingly
	const connect = useCallback(() => {
		getToken()
			.then((resp) => {
				// Detect backend type: try /inbox first.
				// 200 → common-socket backend (inbox data reused, XMPP never touched)
				// 404 / network error → MongooseIM backend
				ChatApi.getInbox()
					.then((inboxResponse) => {
						// ===== COMMON-SOCKET PATH =====
						useStore.getState().setIsMongooseIM(false);
						useStore.getState().setMessagingBackend(new RestMessagingBackend());

						const { wsClient } = useStore.getState().connections;
						wsClient?.connect();

						hydrateStoreFromInbox(inboxResponse, useStore.getState().session.id);

						listMeetings().catch(() => {});
						setChatsBeStatus(true);
					})
					.catch(() => {
						// ===== MONGOOSEIM PATH =====
						useStore.getState().setIsMongooseIM(true);
						useStore.getState().setMessagingBackend(new XmppMessagingBackend());

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
								xmppClient.connect(resp.zmToken);
								const { wsClient } = useStore.getState().connections;
								wsClient?.connect();
							})
							.catch(() => setChatsBeStatus(false));
					});
			})
			.catch((err) => {
				console.error('[MainApp] getToken failed', err);
				setChatsBeStatus(false);
			});
	}, [setChatsBeStatus, setAttributes, attrs]);

	useEffect(() => {
		if (!authenticated) {
			hasConnectedRef.current = false;
			const { wsClient: ws } = useStore.getState().connections;
			ws?.disconnect();
			useStore.getState().reset();
			localStorage.removeItem('carbonio-ws-collaboration-storage');
			return undefined;
		}

		if (!hasConnectedRef.current) {
			hasConnectedRef.current = true;
			connect();
		}

		const handleBeforeUnload = (): void => {
			const { wsClient: ws } = useStore.getState().connections;
			ws?.disconnect();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return (): void => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (authenticated) {
				const { wsClient: ws } = useStore.getState().connections;
				ws?.disconnect();
			}
		};
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
