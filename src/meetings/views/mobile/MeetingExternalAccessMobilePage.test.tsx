/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingExternalAccessMobilePage from './MeetingExternalAccessMobilePage';
import { mockedCreateGuestAccount } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';

const typeHereLabel = 'Type here your name';
const joinLabel = 'Join the meeting';

describe('MeetingExternalAccessMobilePage test', () => {
	test('Component rendered correctly', async () => {
		setup(<MeetingExternalAccessMobilePage />);

		const welcomeTitle = screen.getByText(/Hey stranger!/i);
		const welcomeDesc = screen.getByText(/How would you like to introduce yourself?/i);
		const afterActionDesc = screen.getByText(
			/You will be redirected to the waiting room where a moderator will approve your access./i
		);
		const nameInput = screen.getByRole('textbox', { name: typeHereLabel });
		const joinButton = screen.getByRole('button', { name: joinLabel });

		expect(welcomeTitle).toBeVisible();
		expect(welcomeDesc).toBeVisible();
		expect(afterActionDesc).toBeVisible();
		expect(nameInput).toBeVisible();
		expect(nameInput).toBeEnabled();
		expect(joinButton).toBeVisible();
		expect(joinButton).toBeDisabled();
	});

	test('Create external user', async () => {
		mockedCreateGuestAccount.mockResolvedValueOnce({});
		const { user } = setup(<MeetingExternalAccessMobilePage />);
		const inputName = await screen.findByText(/Type here your name/i);
		await user.type(inputName, 'John Doe');
		const joinButton = await screen.findByRole('button', { name: /Join the meeting/i });
		expect(joinButton).toBeVisible();
		await user.click(joinButton);
		expect(mockedCreateGuestAccount).toHaveBeenCalled();
	});

	test('Create external user with enter key', async () => {
		mockedCreateGuestAccount.mockResolvedValueOnce({});
		const { user } = setup(<MeetingExternalAccessMobilePage />);
		const inputName = await screen.findByText(/Type here your name/i);
		await user.type(inputName, 'John Doe {enter}');
		expect(mockedCreateGuestAccount).toHaveBeenCalled();
	});
});
