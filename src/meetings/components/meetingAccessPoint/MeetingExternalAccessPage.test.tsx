/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingExternalAccessPage from './MeetingExternalAccessPage';
import { mockReplace } from '../../../tests/mocks/global';
import { mockedCreateGuestAccount } from '../../../tests/mocks/network';
import { mockGoToMeetingAccessPage } from '../../../tests/mocks/useRouting';
import { setup } from '../../../tests/test-utils';

const guestAccountResp = {
	id: 'userGuestId',
	tokenId: 'userGuestTokenId',
	zmToken: 'userGuestZmToken',
	zxToken: 'userGuestZxToken'
};

const typeHereLabel = 'Type here your name';
const joinLabel = 'Join the meeting';
const userNameLabel = 'Username Surname';

describe('MeetingExternalAccessPage', () => {
	test('Component rendered correctly', async () => {
		setup(<MeetingExternalAccessPage />);

		const wrapper = screen.getByTestId('external_access_page');
		const welcomeTitle = screen.getByText(/Hey stranger!/i);
		const welcomeDesc = screen.getByText(/How would you like to introduce yourself?/i);
		const afterActionDesc = screen.getByText(
			/You will be redirected to the waiting room where a moderator will approve your access./i
		);
		const nameInput = screen.getByRole('textbox', { name: typeHereLabel });
		const joinButton = screen.getByRole('button', { name: joinLabel });

		expect(wrapper).toBeVisible();
		expect(welcomeTitle).toBeVisible();
		expect(welcomeDesc).toBeVisible();
		expect(afterActionDesc).toBeVisible();
		expect(nameInput).toBeVisible();
		expect(nameInput).toBeEnabled();
		expect(joinButton).toBeVisible();
		expect(joinButton).toBeDisabled();
	});

	test('Create external guest Api fails', async () => {
		// console.error()) is expected
		jest.spyOn(console, 'error').mockImplementation();

		mockedCreateGuestAccount.mockRejectedValueOnce(false);
		const { user } = setup(<MeetingExternalAccessPage />);

		const nameInput = screen.getByRole('textbox', { name: typeHereLabel });
		await user.type(nameInput, userNameLabel);

		const joinButton = screen.getByRole('button', { name: joinLabel });
		await user.click(joinButton);
		const errorSnackbar = await screen.findByText(/Something went Wrong. Please Retry/i);

		expect(mockedCreateGuestAccount).toHaveBeenCalledTimes(1);
		expect(document.cookie).toBe('');
		expect(errorSnackbar).toBeVisible();
	});

	test('External user creates a new guest account', async () => {
		mockedCreateGuestAccount.mockResolvedValueOnce(guestAccountResp);

		const { user } = setup(<MeetingExternalAccessPage />);

		const nameInput = screen.getByRole('textbox', { name: 'Type here your name' });
		await user.type(nameInput, 'Username Surname');

		const joinButton = screen.getByRole('button', { name: 'Join the meeting' });
		await user.click(joinButton);
		expect(mockedCreateGuestAccount).toHaveBeenCalledTimes(1);
		expect(mockGoToMeetingAccessPage).toHaveBeenCalled();
		expect(document.cookie).toBe(
			`ZM_AUTH_TOKEN=${guestAccountResp.zmToken}; ZX_AUTH_TOKEN=${guestAccountResp.zxToken}`
		);
	});

	test('user clicks on the login button', async () => {
		mockedCreateGuestAccount.mockResolvedValueOnce(guestAccountResp);
		mockReplace.mockReturnValueOnce('url');
		const { user } = setup(<MeetingExternalAccessPage />);

		const loginButton = screen.getByRole('button', { name: 'Go to your login page' });
		await user.click(loginButton);

		expect(mockReplace).toHaveBeenCalled();
	});
});
