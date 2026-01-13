/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import MeetingExternalAccessMobilePage from './MeetingExternalAccessMobilePage';
import meetingsApi from '../../../network/apis/MeetingsApi';
import { setup } from '../../../tests/test-utils';

describe('MeetingExternalAccessMobilePage tests', () => {
	test('Meeting name is displayed correctly', async () => {
		vi.spyOn(meetingsApi, 'getScheduledMeetingName').mockResolvedValue({
			name: 'Test Meeting'
		});
		setup(<MeetingExternalAccessMobilePage />);

		expect(await screen.findByText('Welcome to "Test Meeting" virtual room')).toBeInTheDocument();
	});

	test('Create new guest from mobile', async () => {
		const spyCreateGuest = vi.spyOn(meetingsApi, 'createGuestAccount');
		const { user } = setup(<MeetingExternalAccessMobilePage />);
		const nameInput = await screen.findByPlaceholderText('Enter your name');
		await user.type(nameInput, 'Guest User');
		const readyButton = await screen.findByText('Ready to participate');
		await user.click(readyButton);
		expect(spyCreateGuest).toHaveBeenCalled();
	});
});
