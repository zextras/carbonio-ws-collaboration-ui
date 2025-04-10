/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import AddNewMemberModal from './AddNewMemberModal';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { mockSearchUsersByFeatureRequest } from '../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'Test Group',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

const user1: ContactInfo = {
	email: 'user1@domain.com',
	displayName: 'User One',
	id: 'user1-id'
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([testRoom]);
});

describe('Add new Member Modal', () => {
	test('Everything should be rendered - checkbox selected', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValue([user1]);
		setup(
			<AddNewMemberModal
				addNewMemberModalOpen
				addNewMember={jest.fn()}
				closeModal={jest.fn()}
				members={[
					{
						userId: 'user2',
						owner: false,
						temporary: false,
						external: false
					}
				]}
				contactsSelected={[]}
				setContactsSelected={jest.fn()}
				showHistory
				setShowHistory={jest.fn()}
				label={testRoom.name!}
			/>
		);

		await screen.findByTestId('spinner');
		await screen.findByTestId('list_contacts');

		const title = screen.getByText(new RegExp(`Add new members to ${testRoom.name}`, 'i'));
		expect(title).toBeInTheDocument();

		const addButton = screen.getByTestId('add_new_member_button');
		expect(addButton).toBeInTheDocument();

		const checkboxIcon2 = screen.getByTestId('icon: CheckmarkSquare');
		expect(checkboxIcon2).toBeInTheDocument();
	});

	test('Everything should be rendered - checkbox not selected', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValue([user1]);
		setup(
			<AddNewMemberModal
				addNewMemberModalOpen
				addNewMember={jest.fn()}
				closeModal={jest.fn()}
				members={[
					{
						userId: 'user2',
						owner: false,
						temporary: false,
						external: false
					}
				]}
				contactsSelected={[]}
				setContactsSelected={jest.fn()}
				showHistory={false}
				setShowHistory={jest.fn()}
				label={testRoom.name!}
			/>
		);

		await screen.findByTestId('spinner');
		await screen.findByTestId('list_contacts');

		const title = screen.getByText(new RegExp(`Add new members to ${testRoom.name}`, 'i'));
		expect(title).toBeInTheDocument();

		const checkboxIcon = within(screen.getByTestId('modal_footer')).getByTestId('icon: Square');
		expect(checkboxIcon).toBeInTheDocument();
	});
});
