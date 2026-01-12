/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useMemo, useState } from 'react';

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
	const chatSseNetworkStatus = useStore(({ connections }) => connections.status.chat_sse);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [snackbarManuallyClosed, setSnackbarManuallyClosed] = useState(false);
	const [timer, setTimer] = useState<boolean>(false);

	useEffect(() => {
		if (chatsBeNetworkStatus || chatSseNetworkStatus || websocketNetworkStatus) {
			setSnackbarManuallyClosed(false);
			setTimer(false);
		}
	}, [chatsBeNetworkStatus, websocketNetworkStatus, chatSseNetworkStatus]);

	const showSnackbar = useMemo(
		() =>
			!snackbarManuallyClosed &&
			(chatsBeNetworkStatus === false ||
				chatSseNetworkStatus === false ||
				websocketNetworkStatus === false),
		[chatsBeNetworkStatus, websocketNetworkStatus, chatSseNetworkStatus, snackbarManuallyClosed]
	);

	useEffect(() => {
		let timeout: NodeJS.Timeout;
		if (showSnackbar) {
			timeout = setTimeout(() => {
				setTimer(true);
			}, 1000);
		}
		return (): void => {
			timeout && clearTimeout(timeout);
		};
	}, [showSnackbar]);

	if (showSnackbar && timer) {
		return (
			<Snackbar
				open={!chatsBeNetworkStatus || !chatSseNetworkStatus || !websocketNetworkStatus}
				onClose={(): void => setSnackbarManuallyClosed(true)}
				actionLabel={actionLabel}
				disableAutoHide
				severity="warning"
				label={networkProblemLabel}
			/>
		);
	}
	return null;
};

export default ConnectionSnackbarManager;
