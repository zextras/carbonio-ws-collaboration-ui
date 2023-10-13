/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

import { Snackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useStore from '../../store/Store';

const ConnectionSnackbarManager = (): ReactElement => {
	const [t] = useTranslation();
	const actionLabel = t('action.understood', 'Understood');
	const wscNetworkProblemLabel = t(
		'feedback.networkProblem.wsc',
		'Something went wrong while connecting with WSC'
	);
	const xmppNetworkProblemLabel = t(
		'feedback.networkProblem.xmpp',
		'Something went wrong while connecting with XMPP'
	);
	const websocketNetworkProblemLabel = t(
		'feedback.networkProblem.websocket',
		'Something went wrong while connecting with WEBSOCKET'
	);

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
		<>
			{!hideChatsBeSnackbar && !(chatsBeNetworkStatus === undefined) && (
				<Snackbar
					open={!chatsBeNetworkStatus}
					onClose={(): void => setChatsBeSnackbarManuallyClosed(true)}
					actionLabel={actionLabel}
					disableAutoHide
					type="warning"
					label={wscNetworkProblemLabel}
				/>
			)}
			{!hideXmppBeSnackbar && !(xmppNetworkStatus === undefined) && (
				<Snackbar
					open={!xmppNetworkStatus}
					onClose={(): void => setXmppSnackbarManuallyClosed(true)}
					actionLabel={actionLabel}
					disableAutoHide
					type="warning"
					label={xmppNetworkProblemLabel}
				/>
			)}
			{!hideWebsocketSnackbar && !(websocketNetworkStatus === undefined) && (
				<Snackbar
					open={!websocketNetworkStatus}
					onClose={(): void => setWebsocketSnackbarManuallyClosed(true)}
					actionLabel={actionLabel}
					disableAutoHide
					type="warning"
					label={websocketNetworkProblemLabel}
				/>
			)}
		</>
	);
};

export default ConnectionSnackbarManager;
