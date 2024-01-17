/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import AddNewMemberAction from './AddNewMemberAction';
import { ContactMatch } from '../../../../network/soap/AutoCompleteRequest';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { mockedAutoCompleteGalRequest } from '../../../../tests/mocks/AutoCompleteGal';
import { mockedAddRoomMemberRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const zimbraUser1: ContactMatch = {
	email: 'user1@domain.com',
	firstName: 'User 1',
	fullName: 'User One',
	lastName: 'One',
	zimbraId: 'user1-id'
};

const zimbraUser2: ContactMatch = {
	email: 'user2@domain.com',
	firstName: 'User 2',
	fullName: 'User Two',
	lastName: 'Two',
	zimbraId: 'user2-id'
};

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

const mockedRoom = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		}
	]
});

describe('Add new member action', () => {
	test('open/close modal and mark checkbox', async () => {
		const store = useStore.getState();
		store.addRoom(mockedRoom);

		const { user } = setup(<AddNewMemberAction roomId={mockedRoom.id} />);

		user.click(screen.getByText(/Add new Members/i));
		const addMemberModal = await screen.findByTestId('add_member_modal');
		expect(addMemberModal).toBeInTheDocument();

		const checkboxIcon = await screen.findByTestId('icon: Square');
		expect(checkboxIcon).toBeInTheDocument();

		user.click(checkboxIcon);
		const checkmark = await screen.findByTestId('icon: CheckmarkSquare');
		expect(checkmark).toBeInTheDocument();

		user.click(screen.getByTestId('icon: Close'));
		await waitFor(() => expect(addMemberModal).not.toBeInTheDocument());
	});

	test('Add new member', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(mockedRoom);
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
		});
		mockedAutoCompleteGalRequest
			.mockReturnValueOnce([])
			.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		mockedAddRoomMemberRequest.mockReturnValue({
			userId: 'user2-id',
			owner: false
		});
		const { user } = setup(<AddNewMemberAction roomId={mockedRoom.id} />);

		expect(result.current.rooms[mockedRoom.id].members?.length).toBe(1);

		user.click(screen.getByText(/Add new Members/i));
		const addMemberModal = await screen.findByTestId('add_member_modal');
		expect(addMemberModal).toBeInTheDocument();

		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput, zimbraUser2.fullName[0]);

		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();

		const checkboxIcon = screen.queryAllByTestId('icon: Square')[0];
		user.click(checkboxIcon);

		const addButton = await screen.findByTestId('add_new_member_button');
		user.click(addButton);

		await waitFor(() => expect(mockedAddRoomMemberRequest).toBeCalled());
	});
});
