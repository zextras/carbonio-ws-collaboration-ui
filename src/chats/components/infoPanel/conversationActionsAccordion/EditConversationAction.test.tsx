/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import EditConversationAction from './EditConversationAction';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { mockedUpdateRoomRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
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

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

const testRoom2: RoomBe = createMockRoom({
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

describe('Edit conversation action', () => {
	test('open/close modal', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(<EditConversationAction roomId={testRoom.id} />);

		await user.click(screen.getByText(/Edit Details/i));
		expect(screen.getByTestId('edit_conversation_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('edit_conversation_modal')).not.toBeInTheDocument();
	});
	test('edit conversation', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user1Info);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(testRoom2);
		});
		mockedUpdateRoomRequest.mockRejectedValueOnce('Not edited').mockReturnValueOnce({
			id: 'room-test',
			name: 'A new name',
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
		const { user } = setup(<EditConversationAction roomId={testRoom.id} />);
		user.click(screen.getByText(/Edit Details/i));

		const nameInput = await screen.findByTestId('name_input');
		user.type(nameInput, 'A new name');

		const editButton = await screen.findByTestId('edit_button');
		user.click(editButton);

		const snackbar = await screen.findByText(/Something went Wrong. Please Retry/i);
		expect(snackbar).toBeVisible();
		await waitFor(() => expect(result.current.rooms[testRoom2.id].name).toBe('A Group'));

		user.click(editButton);
		await waitFor(() => expect(mockedUpdateRoomRequest).toBeCalledTimes(2));
	});
});
