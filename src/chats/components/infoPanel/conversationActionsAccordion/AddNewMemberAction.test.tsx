/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor, act, renderHook } from '@testing-library/react';

import AddNewMemberAction from './AddNewMemberAction';
import useStore from '../../../../store/Store';
import { createMockRoom, createMockUser } from '../../../../tests/createMock';
import { mockedAddRoomMemberRequest } from '../../../../tests/mocks/network';
import { mockSearchUsersByFeatureRequest } from '../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';
import { User } from '../../../../types/store/UserTypes';

const zimbraUser1: ContactInfo = {
	email: 'user1@domain.com',
	displayName: 'User One',
	id: 'user1-id'
};

const zimbraUser2: ContactInfo = {
	email: 'user2@domain.com',
	displayName: 'User Two',
	id: 'user2-id'
};

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

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
		const addMemberModal = await screen.findByTestId('add_member_modal');
		expect(addMemberModal).toBeInTheDocument();

		const checkboxIcon = await screen.findByTestId('icon: Square');
		expect(checkboxIcon).toBeInTheDocument();

		await user.click(checkboxIcon);
		const checkmark = await screen.findByTestId('icon: CheckmarkSquare');
		expect(checkmark).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		await waitFor(() => expect(addMemberModal).not.toBeInTheDocument());
	});

	test('Add new member', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(mockedRoom);
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
		});
		mockSearchUsersByFeatureRequest
			.mockReturnValueOnce([])
			.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		mockedAddRoomMemberRequest.mockReturnValue({
			userId: 'user2-id',
			owner: false
		});
		const { user } = setup(<AddNewMemberAction roomId={mockedRoom.id} />);

		expect(result.current.rooms[mockedRoom.id].members?.length).toBe(1);

		await user.click(screen.getByText(/Add new Members/i));
		const addMemberModal = await screen.findByTestId('add_member_modal');
		expect(addMemberModal).toBeInTheDocument();

		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser2.displayName[0]);

		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();

		const checkboxIcon = screen.queryAllByTestId('icon: Square')[0];
		await user.click(checkboxIcon);

		const addButton = await screen.findByTestId('add_new_member_button');
		await user.click(addButton);

		await waitFor(() => expect(mockedAddRoomMemberRequest).toHaveBeenCalled());
	});
});
