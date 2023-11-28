/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useState } from 'react';

import { Snackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useStore from '../../store/Store';

const ConnectionSnackbarManager = (): ReactElement | null => {
	const [t] = useTranslation();
	const actionLabel = t('action.understood', 'Understood');
	const networkProblemLabel = t(
		'feedback.networkProblems',
		'There may be problems using this module, please try to refresh the page.'
	);

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const xmppNetworkStatus = useStore(({ connections }) => connections.status.xmpp);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [snackbarManuallyClosed, setSnackbarManuallyClosed] = useState(false);

	useEffect(() => {
		if (chatsBeNetworkStatus || xmppNetworkStatus || websocketNetworkStatus) {
			setSnackbarManuallyClosed(false);
		}
	}, [chatsBeNetworkStatus, websocketNetworkStatus, xmppNetworkStatus]);

	if (
		!snackbarManuallyClosed &&
		(chatsBeNetworkStatus === false ||
			xmppNetworkStatus === false ||
			websocketNetworkStatus === false)
	) {
		return (
			<Snackbar
				open={!chatsBeNetworkStatus || !xmppNetworkStatus || !websocketNetworkStatus}
				onClose={(): void => setSnackbarManuallyClosed(true)}
				actionLabel={actionLabel}
				disableAutoHide
				type="warning"
				label={networkProblemLabel}
			/>
		);
	}
	return null;
};

export default ConnectionSnackbarManager;
