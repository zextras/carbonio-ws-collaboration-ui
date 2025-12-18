/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import EditConversationAction from './EditConversationAction';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

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

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1Info.id, user1Info.name);
	store.setUserInfo([user1Info, user2Info]);
	store.addRooms([testRoom, testRoom2]);
});

describe('Edit conversation action', () => {
	test('open/close modal', async () => {
		const { user } = setup(<EditConversationAction roomId={testRoom.id} />);

		await user.click(screen.getByText(/Edit Details/i));
		expect(screen.getByTestId('edit_conversation_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('edit_conversation_modal')).not.toBeInTheDocument();
	});

	test('edit conversation', async () => {
		const spyOnUpdateRoom = vi.spyOn(roomsApi, 'updateRoom');
		spyOnUpdateRoom.mockRejectedValueOnce('Not edited');

		const { user } = setup(<EditConversationAction roomId={testRoom.id} />);
		await user.click(screen.getByText(/Edit Details/i));

		const nameInput = await screen.findByTestId('name_input');
		await user.type(nameInput, 'A new name');

		const editButton = await screen.findByRole('button', { name: /Edit details/i });
		await user.click(editButton);

		const snackbar = await screen.findByText(/Something went Wrong. Please Retry/i);
		expect(snackbar).toBeVisible();
		expect(useStore.getState().rooms[testRoom2.id].name).toBe('A Group');

		await user.click(editButton);
		expect(spyOnUpdateRoom).toHaveBeenCalledTimes(2);
	});
});
