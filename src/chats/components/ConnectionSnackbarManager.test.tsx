/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import ConnectionSnackbarManager from './ConnectionSnackbarManager';
import useStore from '../../store/Store';
import { setup } from '../../tests/test-utils';

describe('ConnectionSnackbarManager', () => {
	test('Snackbar is shown when there is chatsBe network problem', async () => {
		const store = useStore.getState();
		store.setChatsBeStatus(false);
		setup(<ConnectionSnackbarManager />);
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	test('Snackbar is shown when there is websocket network problem', async () => {
		const store = useStore.getState();
		store.setWebsocketStatus(false);
		setup(<ConnectionSnackbarManager />);
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	test('Snackbar is shown when there is xmpp network problem', async () => {
		const store = useStore.getState();
		store.setXmppStatus(false);
		setup(<ConnectionSnackbarManager />);
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	test('Snackbar is shown when there is only websocket problem and other two connection are established', async () => {
		setup(<ConnectionSnackbarManager />);
		const store = useStore.getState();
		act(() => {
			store.setChatsBeStatus(true);
			store.setWebsocketStatus(false);
			store.setXmppStatus(true);
		});
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});

	test('Snackbar disappears when websocket problem is resolved', async () => {
		setup(<ConnectionSnackbarManager />);
		const store = useStore.getState();
		act(() => store.setWebsocketStatus(false));
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();

		act(() => store.setWebsocketStatus(true));
		expect(snackbar).not.toBeInTheDocument();
	});

	test('Snackbar disappears if user clicks on close button', async () => {
		setup(<ConnectionSnackbarManager />);
		const store = useStore.getState();
		act(() => store.setWebsocketStatus(false));

		const closeButton = await screen.findByText('Understood');
		act(() => closeButton.click());
		const snackbar = screen.queryByTestId('snackbar');
		expect(snackbar).not.toBeInTheDocument();
	});

	test('Snackbar appears again if there are a new connection error also if user clicked on close button', async () => {
		setup(<ConnectionSnackbarManager />);
		const store = useStore.getState();
		act(() => store.setWebsocketStatus(false));

		const closeButton = await screen.findByText('Understood');
		act(() => closeButton.click());

		act(() => store.setWebsocketStatus(true));
		act(() => store.setWebsocketStatus(false));
		const snackbar = await screen.findByTestId('snackbar');
		expect(snackbar).toBeInTheDocument();
	});
});
