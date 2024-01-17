/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import LeaveConversationAction from './LeaveConversationAction';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { mockedDeleteRoomMemberRequest } from '../../../../tests/mocks/network';
import { mockGoToMainPage } from '../../../../tests/mocks/useRouting';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Info: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
};
const user2Info: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
};

const mockedRoom2 = createMockRoom({
	id: 'roomId',
	type: 'roomType',
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Info.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
});

const mockedRoom = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Info.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
});

describe('Leave conversation Action', () => {
	test('leave conversation - open and close modal', async () => {
		const store = useStore.getState();
		store.setLoginInfo(user2Info.id, user2Info.name);
		store.addRoom(mockedRoom2);
		const { user } = setup(
			<LeaveConversationAction
				type={mockedRoom2.type}
				roomId={mockedRoom2.id}
				iAmOneOfOwner={false}
			/>
		);
		await user.click(screen.getByText(/Leave Room/i));
		expect(screen.getByTestId('leave_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('leave_modal')).not.toBeInTheDocument();
	});
	test('leave conversation', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user2Info.id, user2Info.name);
			result.current.addRoom(mockedRoom);
		});
		mockedDeleteRoomMemberRequest.mockReturnValueOnce('you left the conversation');
		mockGoToMainPage.mockReturnValue('main page');
		const { user } = setup(
			<LeaveConversationAction
				type={mockedRoom.type}
				roomId={mockedRoom.id}
				iAmOneOfOwner={false}
			/>
		);

		expect(result.current.rooms[mockedRoom.id].members?.length).toBe(2);

		user.click(screen.getByText(/Leave Group/i));
		const button = await screen.findByRole('button', { name: 'Leave' });
		user.click(button);
		await waitFor(() => expect(mockedDeleteRoomMemberRequest).toBeCalled());
		await waitFor(() => expect(mockGoToMainPage).toBeCalled());
	});
});
