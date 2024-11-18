/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';

import WaitingUser from './WaitingUser';
import useStore from '../../../../store/Store';
import { createMockUser } from '../../../../tests/createMock';
import { mockedAcceptWaitingUserRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { UserType } from '../../../../types/store/UserTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const guestUser = createMockUser({ id: 'guestUserId', type: UserType.GUEST });

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo(user1);
});

describe('WaitingUser tests', () => {
	test('Should render the name of the user', () => {
		setup(<WaitingUser meetingId="meetingId" userId={user1.id} />);
		const name = screen.getByText(user1.name);
		expect(name).toBeInTheDocument();
	});

	test('Should render the accept and reject buttons', () => {
		setup(<WaitingUser meetingId="meetingId" userId={user1.id} />);
		const acceptButtonIcon = screen.getByTestId('icon: CheckmarkOutline');
		const rejectButtonIcon = screen.getByTestId('icon: CloseOutline');
		expect(acceptButtonIcon).toBeInTheDocument();
		expect(rejectButtonIcon).toBeInTheDocument();
	});

	test('Moderator clicks on accept button', async () => {
		mockedAcceptWaitingUserRequest.mockResolvedValue({});
		const { user } = setup(<WaitingUser meetingId="meetingId" userId={user1.id} />);
		const acceptButton = screen.getByTestId('icon: CheckmarkOutline');
		await user.click(acceptButton);
		expect(mockedAcceptWaitingUserRequest).toBeCalledWith('meetingId', user1.id, true);
	});

	test('Moderator clicks on reject button', async () => {
		mockedAcceptWaitingUserRequest.mockResolvedValue({});
		const { user } = setup(<WaitingUser meetingId="meetingId" userId={user1.id} />);
		const acceptButton = screen.getByTestId('icon: CloseOutline');
		await user.click(acceptButton);
		expect(mockedAcceptWaitingUserRequest).toBeCalledWith('meetingId', user1.id, false);
	});

	test('User in waiting room is a logged user', async () => {
		setup(<WaitingUser meetingId="meetingId" userId={user1.id} />);
		const guestLabel = screen.queryByText('Guest');
		expect(guestLabel).not.toBeInTheDocument();
	});

	test('User in waiting room is an external user', async () => {
		setup(<WaitingUser meetingId="meetingId" userId={guestUser.id} />);
		act(() => {
			const store = useStore.getState();
			store.setUserInfo(guestUser);
		});

		const guestLabel = await screen.findByText('Guest');
		expect(guestLabel).toBeVisible();
	});
});
