/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import MainApp from './MainApp';
import sessionApi from './network/apis/InfoApi';
import meetingsApi from './network/apis/MeetingsApi';
import roomsApi from './network/apis/RoomsApi';
import useStore from './store/Store';
import { setup } from './tests/test-utils';

describe('Entry point', () => {
	test('Set app version', () => {
		setup(<MainApp />);
		expect(useStore.getState().session.apiVersion).toBeDefined();
	});

	test('Set login info of an authenticated user', () => {
		vi.spyOn(shell, 'useAuthenticated').mockReturnValue(true);
		setup(<MainApp />);
		const { id, name, displayName, userType } = useStore.getState().session;
		expect(id).toBeDefined();
		expect(name).toBeDefined();
		expect(displayName).toBeDefined();
		expect(userType).toBe('internal');
	});

	test('Avoid setting login info of an unauthenticated user', () => {
		vi.spyOn(shell, 'useAuthenticated').mockReturnValue(false);
		setup(<MainApp />);
		const { id, name, displayName, userType } = useStore.getState().session;
		expect(id).toBeUndefined();
		expect(name).toBeUndefined();
		expect(displayName).toBeUndefined();
		expect(userType).toBeUndefined();
	});

	test('Connection is established on app load', async () => {
		vi.spyOn(shell, 'useAuthenticated').mockReturnValue(true);
		vi.spyOn(sessionApi, 'getToken').mockResolvedValueOnce({ zmToken: '1234' });
		vi.spyOn(roomsApi, 'listRooms').mockResolvedValueOnce([]);
		vi.spyOn(meetingsApi, 'listMeetings').mockResolvedValueOnce([]);
		setup(<MainApp />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(true));
	});

	test('Connection is not established on app load if getToken do not respond', async () => {
		vi.spyOn(shell, 'useAuthenticated').mockReturnValue(true);
		vi.spyOn(sessionApi, 'getToken').mockRejectedValueOnce(new Error('Token error'));
		setup(<MainApp />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(false));
	});

	test('Connection is not established on app load if listRooms do not respond', async () => {
		vi.spyOn(shell, 'useAuthenticated').mockReturnValue(true);
		vi.spyOn(sessionApi, 'getToken').mockResolvedValueOnce({ zmToken: '1234' });
		vi.spyOn(roomsApi, 'listRooms').mockRejectedValueOnce(new Error());
		setup(<MainApp />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(false));
	});
});
