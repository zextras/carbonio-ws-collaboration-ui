/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import AddNewMemberModal from './AddNewMemberModal';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { mockedAutoCompleteGalRequest } from '../../../../tests/mocks/AutoCompleteGal';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'Test Group',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

describe('Add new Member Modal', () => {
	test('Everything should be rendered - checkbox selected', async () => {
		mockedAutoCompleteGalRequest.mockReturnValue([]);
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
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
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				showHistory
				setShowHistory={jest.fn()}
				label={testRoom.name!}
			/>
		);

		await screen.findByText('spinner');
		await screen.findByTestId('list_creation_modal');

		const title = screen.getByText(new RegExp(`Add new members to ${testRoom.name}`, 'i'));
		expect(title).toBeInTheDocument();

		const addButton = screen.getByTestId('add_new_member_button');
		expect(addButton).toBeInTheDocument();

		const checkboxIcon2 = screen.getByTestId('icon: CheckmarkSquare');
		expect(checkboxIcon2).toBeInTheDocument();
	});
	test('Everything should be rendered - checkbox not selected', async () => {
		mockedAutoCompleteGalRequest.mockReturnValue([]);
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
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
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				showHistory={false}
				setShowHistory={jest.fn()}
				label={testRoom.name!}
			/>
		);

		await screen.findByText('spinner');
		await screen.findByTestId('list_creation_modal');

		const title = screen.getByText(new RegExp(`Add new members to ${testRoom.name}`, 'i'));
		expect(title).toBeInTheDocument();

		const checkboxIcon = screen.getByTestId('icon: Square');
		expect(checkboxIcon).toBeInTheDocument();
	});
});
