/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SnackbarManager, Snackbar } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';

import useStore from '../store/Store';

const useSnackbarManager = (): ReactElement => {
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const xmppNetworkStatus = useStore(({ connections }) => connections.status.xmpp);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	return (
		<SnackbarManager>
			{!chatsBeNetworkStatus && !(chatsBeNetworkStatus === undefined) && (
				<Snackbar
					open={!chatsBeNetworkStatus}
					hideButton
					disableAutoHide
					type="warning"
					label={'Error on connection with CHATS CE'}
				/>
			)}
			{!xmppNetworkStatus && !(xmppNetworkStatus === undefined) && (
				<Snackbar
					open={!xmppNetworkStatus}
					hideButton
					disableAutoHide
					type="warning"
					label={'Error on connection with XMPP'}
				/>
			)}
			{!websocketNetworkStatus && !(websocketNetworkStatus === undefined) && (
				<Snackbar
					open={!websocketNetworkStatus}
					hideButton
					disableAutoHide
					type="warning"
					label={'Error on connection with WEBSOCKET'}
				/>
			)}
		</SnackbarManager>
	);
};

export default useSnackbarManager;
