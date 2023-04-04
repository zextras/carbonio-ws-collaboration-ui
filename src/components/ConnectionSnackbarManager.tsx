/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SnackbarManager, Snackbar } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import useStore from '../store/Store';

const ConnectionSnackbarManager = (): ReactElement => {
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const xmppNetworkStatus = useStore(({ connections }) => connections.status.xmpp);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [chatsBeSnackbarManuallyClosed, setChatsBeSnackbarManuallyClosed] = useState(false);
	const [xmppSnackbarManuallyClosed, setXmppSnackbarManuallyClosed] = useState(false);
	const [websocketSnackbarManuallyClosed, setWebsocketSnackbarManuallyClosed] = useState(false);

	const hideChatsBeSnackbar = useMemo(
		() => chatsBeSnackbarManuallyClosed || chatsBeNetworkStatus,
		[chatsBeNetworkStatus, chatsBeSnackbarManuallyClosed]
	);

	const hideXmppBeSnackbar = useMemo(
		() => xmppSnackbarManuallyClosed || xmppNetworkStatus,
		[xmppNetworkStatus, xmppSnackbarManuallyClosed]
	);

	const hideWebsocketSnackbar = useMemo(
		() => websocketSnackbarManuallyClosed || websocketNetworkStatus,
		[websocketNetworkStatus, websocketSnackbarManuallyClosed]
	);

	useEffect(() => {
		if (chatsBeNetworkStatus) {
			setChatsBeSnackbarManuallyClosed(false);
		}
	}, [chatsBeNetworkStatus]);

	useEffect(() => {
		if (xmppNetworkStatus) {
			setXmppSnackbarManuallyClosed(false);
		}
	}, [xmppNetworkStatus]);

	useEffect(() => {
		if (websocketNetworkStatus) {
			setWebsocketSnackbarManuallyClosed(false);
		}
	}, [websocketNetworkStatus]);

	return (
		<SnackbarManager>
			{!hideChatsBeSnackbar && !(chatsBeNetworkStatus === undefined) && (
				<Snackbar
					open={!chatsBeNetworkStatus}
					onClose={(): void => setChatsBeSnackbarManuallyClosed(true)}
					actionLabel="Close"
					disableAutoHide
					type="warning"
					label={'Error: Chats CE'}
				/>
			)}
			{!hideXmppBeSnackbar && !(xmppNetworkStatus === undefined) && (
				<Snackbar
					open={!xmppNetworkStatus}
					onClose={(): void => setXmppSnackbarManuallyClosed(true)}
					actionLabel="Close"
					disableAutoHide
					type="warning"
					label={'Error: XMPP'}
				/>
			)}
			{!hideWebsocketSnackbar && !(websocketNetworkStatus === undefined) && (
				<Snackbar
					open={!websocketNetworkStatus}
					onClose={(): void => setWebsocketSnackbarManuallyClosed(true)}
					actionLabel="Close"
					disableAutoHide
					type="warning"
					label={'Error: WebSocket'}
				/>
			)}
		</SnackbarManager>
	);
};

export default ConnectionSnackbarManager;
