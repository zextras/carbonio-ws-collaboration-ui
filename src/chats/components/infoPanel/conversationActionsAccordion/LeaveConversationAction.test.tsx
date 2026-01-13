/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import LeaveConversationAction from './LeaveConversationAction';
import { mockGoToMainPage } from '../../../../hooks/__mocks__/useRouting';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

const mockedRoom = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user2Info.id })
	]
});

vi.mock('../../../../hooks/useRouting');

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user2Info.id, user2Info.name);
	store.addRooms([mockedRoom]);
});
describe('Leave conversation Action', () => {
	test('leave conversation - open and close modal', async () => {
		const { user } = setup(
			<LeaveConversationAction
				type={mockedRoom.type}
				roomId={mockedRoom.id}
				iAmOneOfOwner={false}
			/>
		);
		await user.click(screen.getByText(/Leave Group/i));
		expect(screen.getByTestId('leave_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('leave_modal')).not.toBeInTheDocument();
	});

	test('leave conversation', async () => {
		const spyOnDeleteRoomMember = vi.spyOn(roomsApi, 'deleteRoomMember');
		const { user } = setup(
			<LeaveConversationAction
				type={mockedRoom.type}
				roomId={mockedRoom.id}
				iAmOneOfOwner={false}
			/>
		);

		expect(useStore.getState().rooms[mockedRoom.id].members?.length).toBe(2);

		await user.click(screen.getByText(/Leave Group/i));
		const button = await screen.findByRole('button', { name: 'Leave' });
		await user.click(button);
		expect(spyOnDeleteRoomMember).toHaveBeenCalled();
		expect(mockGoToMainPage).toHaveBeenCalled();
	});
});
