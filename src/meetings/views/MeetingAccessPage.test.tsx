/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingAccessPage from './MeetingAccessPage';
import useStore from '../../store/Store';
import { mockMediaDevicesResolve } from '../../tests/mocks/global';
import { setup } from '../../tests/test-utils';

beforeAll(() => {
	mockMediaDevicesResolve();
});

describe('MeetingAccessPage', () => {
	test('Leave button for guest user', async () => {
		const store = useStore.getState();
		store.setChatsBeStatus(true);

		setup(<MeetingAccessPage />);
		const icon = await screen.findByTestId('icon: LogOut');
		expect(icon).toBeVisible();
	});
});
