/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';

import AddNewMemberAction from './AddNewMemberAction';
import * as api from '../../../../network/apis/RoomsApi';
import { mockSearchUsersByFeatureRequest } from '../../../../network/soap/__mocks__/SearchUsersByFeatureRequest';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';
import { User } from '../../../../types/store/UserTypes';

const user1: ContactInfo = {
	email: 'user1@domain.com',
	displayName: 'User One',
	id: 'user1-id'
};

const user2: ContactInfo = {
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

vi.mock('../../../../network/soap/SearchUsersByFeatureRequest');

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([mockedRoom]);
	store.setLoginInfo({ id: user1Info.id, name: user1Info.name });
	store.setUserInfo([user2Info]);
	store.setAttributes(createMockAttributesList({ carbonioWscMaxGroupMembers: '5' }));
});

describe('Add new member action', () => {
	test('open/close modal and mark checkbox', async () => {
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
		const spyOnAddRoomMember = vi.spyOn(api, 'addRoomMembers');
		mockSearchUsersByFeatureRequest.mockReturnValueOnce({ contacts: [user1, user2] });
		const { user } = setup(<AddNewMemberAction roomId={mockedRoom.id} />);

		await user.click(screen.getByText(/Add new Members/i));
		const addMemberModal = await screen.findByTestId('add_member_modal');
		expect(addMemberModal).toBeInTheDocument();

		const chipInput = await screen.findByTestId('chip_input_contact_selector');
		await user.type(chipInput, user2.displayName[0]);

		const list = await screen.findByTestId('list_contacts');
		expect(list).toBeInTheDocument();

		const listUser = await within(list).findByText(user2.displayName);
		await user.click(listUser);

		const chipUser = await within(
			await screen.findByTestId('chip_input_contact_selector')
		).findAllByText(user2.displayName);
		expect(chipUser[0]).toBeInTheDocument();

		const addButton = await screen.findByTestId('add_new_member_button');
		await user.click(addButton);

		await waitFor(() => expect(spyOnAddRoomMember).toHaveBeenCalled());
	});
});
