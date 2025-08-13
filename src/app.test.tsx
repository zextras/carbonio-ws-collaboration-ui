/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';

import App from './app';
import useStore from './store/Store';
import { setup } from './tests/test-utils';
import { useAuthenticated } from '../__mocks__/@zextras/carbonio-shell-ui';
import sessionApi from './network/apis/InfoApi';
import {
	MeetingsApiToSpy,
	RoomsApiToSpy,
	spyOnMeetingsApi,
	spyOnRoomsApi
} from './tests/mocks/network';

describe('Entry point', () => {
	test('Set app version', () => {
		setup(<App />);
		expect(useStore.getState().session.apiVersion).toBeDefined();
	});

	test('Set login info of an authenticated user', () => {
		useAuthenticated.mockReturnValue(true);
		setup(<App />);
		const { id, name, displayName, userType } = useStore.getState().session;
		expect(id).toBeDefined();
		expect(name).toBeDefined();
		expect(displayName).toBeDefined();
		expect(userType).toBe('internal');
	});

	test('Avoid setting login info of an unauthenticated user', () => {
		useAuthenticated.mockReturnValue(false);
		setup(<App />);
		const { id, name, displayName, userType } = useStore.getState().session;
		expect(id).toBeUndefined();
		expect(name).toBeUndefined();
		expect(displayName).toBeUndefined();
		expect(userType).toBeUndefined();
	});

	test('Connection is established on app load', async () => {
		useAuthenticated.mockReturnValue(true);
		jest.spyOn(sessionApi, 'getToken').mockResolvedValueOnce({ zmToken: '1234' });
		spyOnRoomsApi(RoomsApiToSpy.LIST_ROOMS).mockResolvedValueOnce([]);
		spyOnMeetingsApi(MeetingsApiToSpy.LIST_MEETINGS).mockResolvedValueOnce([]);
		setup(<App />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(true));
	});

	test('Connection is not established on app load if getToken do not respond', async () => {
		useAuthenticated.mockReturnValue(true);
		jest.spyOn(sessionApi, 'getToken').mockRejectedValueOnce(new Error('Token error'));
		setup(<App />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(false));
	});

	test('Retry getToken on version_mismatch error', async () => {
		useAuthenticated.mockReturnValue(true);
		jest.spyOn(sessionApi, 'getToken').mockRejectedValueOnce(new Error('version_mismatch'));
		spyOnRoomsApi(RoomsApiToSpy.LIST_ROOMS).mockResolvedValueOnce([]);
		spyOnMeetingsApi(MeetingsApiToSpy.LIST_MEETINGS).mockResolvedValueOnce([]);
		setup(<App />);
		await waitFor(() => expect(useStore.getState().connections.status.chats_be).toBe(true));
		expect(sessionApi.getToken).toHaveBeenCalledTimes(2);
	});
});
