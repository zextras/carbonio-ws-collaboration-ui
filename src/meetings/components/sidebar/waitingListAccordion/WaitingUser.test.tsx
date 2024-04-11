/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import WaitingUser from './WaitingUser';
import useStore from '../../../../store/Store';
import { createMockUser } from '../../../../tests/createMock';
import { mockedAcceptWaitingUserRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

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

	test('If user is not found, should render a shimmer', () => {
		setup(<WaitingUser meetingId="meetingId" userId={user2.id} />);
		const shimmer = screen.getByTestId('avatarShimmer');
		expect(shimmer).toBeInTheDocument();
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
});
