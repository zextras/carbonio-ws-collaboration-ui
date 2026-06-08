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
import { Version } from './types/store/SessionTypes';
import { setDateDefault } from './utils/dateUtils';
import { probeBackendApiVersion } from './utils/FetchUtils';

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

	// NETWORKS: detect backend type via the X-WSC-API-VERSION header, then load accordingly.
	// Both backends expose GET /rooms (200) and stamp the version header on every response:
	// common-socket reports >= 2.0.0, devel/MongooseIM reports 1.6.x.
	const connect = useCallback(() => {
		getToken()
			.then((resp) => {
				// Probe the backend version off a lightweight request both backends serve.
				// WSC-pure (RestMessagingBackend) iff the header is present AND >= 2.0.0;
				// otherwise fall back to MongooseIM (XmppMessagingBackend) — this also covers
				// a missing/unparseable header.
				probeBackendApiVersion().then((serverVersion) => {
					let isWscPure = false;
					if (serverVersion) {
						try {
							useStore.getState().setApiVersion(serverVersion as Version);
							isWscPure = gte(serverVersion, '2.0.0');
						} catch {
							isWscPure = false;
						}
					}

					if (isWscPure) {
						// ===== COMMON-SOCKET PATH =====
						useStore.getState().setIsMongooseIM(false);
						useStore.getState().setMessagingBackend(new RestMessagingBackend());

						const { wsClient } = useStore.getState().connections;
						wsClient?.connect();

						ChatApi.getInbox()
							.then((inboxResponse) => {
								hydrateStoreFromInbox(inboxResponse, useStore.getState().session.id);
								listMeetings().catch(() => {});
								setChatsBeStatus(true);
							})
							.catch(() => setChatsBeStatus(false));
						return;
					}

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
