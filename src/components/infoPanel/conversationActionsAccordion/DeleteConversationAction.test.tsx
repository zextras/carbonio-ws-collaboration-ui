/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import { mockedDeleteRoomRequest, mockGoToMainPage } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';
import DeleteConversationAction from './DeleteConversationAction';

const user1Info: User = {
	id: 'user1-id',
	email: 'user1@domain.com',
	name: 'User 1'
};

const user2Info: User = {
	id: 'user2-id',
	email: 'user2@domain.com',
	name: 'User 2'
};

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
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

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	type: 'AAA',
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

describe('delete conversation action', () => {
	test('open/close modal', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		const { user } = setup(
			<DeleteConversationAction roomId={testRoom2.id} type={testRoom2.type} numberOfMembers={2} />
		);
		const deleteRoomLabel = screen.getByText(/Delete Room/i);
		await user.click(deleteRoomLabel);
		expect(screen.getByTestId('delete_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('leave_modal')).not.toBeInTheDocument();
	});
	test('delete conversation', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.addRoom(testRoom);
		mockedDeleteRoomRequest
			.mockRejectedValueOnce("conversation's still here")
			.mockReturnValueOnce('the conversation has been deleted');
		mockGoToMainPage.mockReturnValueOnce('main page');
		const { user } = setup(
			<DeleteConversationAction roomId={testRoom.id} type={testRoom.type} numberOfMembers={2} />
		);
		const deleteRoomLabel = screen.getByText(/Delete Group/i);
		await user.click(deleteRoomLabel);

		const deleteButton = screen.getAllByRole('button')[2];

		await user.click(deleteButton);
		expect(mockGoToMainPage).not.toBeCalled();

		await user.click(deleteButton);
		expect(mockGoToMainPage).toBeCalled();
	});
});
