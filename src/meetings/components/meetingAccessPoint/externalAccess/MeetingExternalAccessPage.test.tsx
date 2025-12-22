/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import MeetingExternalAccessPage from './MeetingExternalAccessPage';
import meetingsApi from '../../../../network/apis/MeetingsApi';
import { setup } from '../../../../tests/test-utils';

describe('MeetingExternalAccessPage tests', () => {
	test('Meeting name is displayed correctly', async () => {
		vi.spyOn(meetingsApi, 'getScheduledMeetingName').mockResolvedValue({
			name: 'Test Meeting'
		});
		setup(<MeetingExternalAccessPage />);

		expect(await screen.findByText('Welcome to "Test Meeting" virtual room')).toBeInTheDocument();
	});

	test('Create new guest', async () => {
		const spyCreateGuest = vi.spyOn(meetingsApi, 'createGuestAccount');

		const { user } = setup(<MeetingExternalAccessPage />);
		const nameInput = await screen.findByPlaceholderText('Enter your name');
		await user.type(nameInput, 'Guest User');
		const readyButton = await screen.findByText('Ready to participate');
		await user.click(readyButton);
		expect(spyCreateGuest).toHaveBeenCalled();
	});

	test('Redirect to login page', async () => {
		window.location.pathname = 'https://localhost/carbonio/meetings/meeting-id';
		const { user } = setup(<MeetingExternalAccessPage />);
		const loginButton = await screen.findByText('Go to your login page');
		await user.click(loginButton);
		expect(window.location.replace).toHaveBeenCalled();
	});
});
