/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import MeetingExternalAccessMobilePage from './MeetingExternalAccessMobilePage';
import * as api from '../../../network/apis/MeetingsApi';
import { setup } from '../../../tests/test-utils';
import * as UserMediaManager from '../../../utils/UserMediaManager';

const videoOff = 'icon: VideoOff';

describe('MeetingExternalAccessMobilePage tests', () => {
	test('Meeting name is displayed correctly', async () => {
		vi.spyOn(api, 'getScheduledMeetingName').mockResolvedValue({
			name: 'Test Meeting'
		});
		setup(<MeetingExternalAccessMobilePage />);

		expect(await screen.findByText('Welcome to "Test Meeting" virtual room')).toBeInTheDocument();
	});

	test('Create new guest from mobile', async () => {
		const spyCreateGuest = vi.spyOn(api, 'createGuestAccount');
		const { user } = setup(<MeetingExternalAccessMobilePage />);
		const nameInput = await screen.findByPlaceholderText('Enter your name');
		await user.type(nameInput, 'Guest User');
		const readyButton = await screen.findByText('Ready to participate');
		await user.click(readyButton);
		expect(spyCreateGuest).toHaveBeenCalled();
	});

	test('Camera button is initially off and enabling it requests the front camera stream', async () => {
		const fakeStream = {
			getTracks: () => []
		} as unknown as MediaStream;
		const spyOnFrontCamera = vi
			.spyOn(UserMediaManager, 'getFrontCameraStream')
			.mockResolvedValue(fakeStream);
		const { user } = setup(<MeetingExternalAccessMobilePage />);

		const videoOffButton = await screen.findByTestId(videoOff);
		await user.click(videoOffButton);

		expect(spyOnFrontCamera).toHaveBeenCalled();
		expect(await screen.findByTestId('icon: Video')).toBeInTheDocument();
	});

	test('Toggling the camera off releases the media stream', async () => {
		const stopTrack = vi.fn();
		const fakeStream = {
			getTracks: () => [{ stop: stopTrack }]
		} as unknown as MediaStream;
		vi.spyOn(UserMediaManager, 'getFrontCameraStream').mockResolvedValue(fakeStream);

		const { user } = setup(<MeetingExternalAccessMobilePage />);
		const videoOffButton = await screen.findByTestId(videoOff);
		await user.click(videoOffButton);

		const videoOnButton = await screen.findByTestId('icon: Video');
		await user.click(videoOnButton);

		expect(stopTrack).toHaveBeenCalled();
		expect(await screen.findByTestId(videoOff)).toBeInTheDocument();
	});
});
