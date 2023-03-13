/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { setup } from 'test-utils';

import { mockedAddRoomMemberRequest, mockedAutoCompleteGalRequest } from '../../../../jest-mocks';
import { ContactMatch } from '../../../network/soap/AutoCompleteRequest';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { RoomType } from '../../../types/network/models/roomBeTypes';
import { User } from '../../../types/store/UserTypes';
import AddNewMemberAction from './AddNewMemberAction';

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

		await user.click(screen.getByText(/Add new Members/i));
		expect(screen.getByTestId('modal')).toBeInTheDocument();

		const checkboxIcon = screen.getByTestId('icon: Square');
		expect(checkboxIcon).toBeInTheDocument();

		await user.click(checkboxIcon);
		expect(screen.getByTestId('icon: CheckmarkSquare')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
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

		await user.click(screen.getByText(/Add new Members/i));
		expect(screen.getByTestId('modal')).toBeInTheDocument();

		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser2.fullName[0]);

		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();

		const checkboxIcon = screen.queryAllByTestId('icon: Square')[0];
		await user.click(checkboxIcon);

		const addButton = screen.getAllByRole('button');
		await user.click(addButton[3]);

		expect(result.current.rooms[mockedRoom.id].members?.length).toBe(2);
	});
});
