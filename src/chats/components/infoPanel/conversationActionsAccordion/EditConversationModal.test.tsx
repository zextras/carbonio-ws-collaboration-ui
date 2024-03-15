/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import EditConversationModal from './EditConversationModal';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { mockedUpdateRoomRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'Name',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

describe('Edit group Details Modal', () => {
	test('All elements should be rendered', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		setup(<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />);
		const nameInput = screen.getByTestId('name_input');
		const descriptionInput = screen.getByTestId('description_input');
		const editButton = screen.getByTestId('edit_button');
		expect(nameInput).toBeInTheDocument();
		expect(descriptionInput).toBeInTheDocument();
		expect(editButton).toBeInTheDocument();
		expect(editButton).not.toBeEnabled();
	});

	test('Button should be active if i modify a field', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		const editButton = screen.getByTestId('edit_button');
		const nameInput = screen.getByTestId('name_input');
		expect(editButton).not.toBeEnabled();
		expect(screen.getByDisplayValue(new RegExp(`${testRoom2.name}`, 'i'))).toBeInTheDocument();

		await user.type(nameInput, 'A Group!');
		expect(screen.getByDisplayValue(/A Group!/i)).toBeInTheDocument();
		expect(editButton).toBeEnabled();
	});

	test('Errors on input fields', async () => {
		// setup of the room
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		// inside testRoom, the title field is empty, that's why the title input shound be in error state
		const editButton = screen.getByTestId('edit_button');
		const nameInput = screen.getByTestId('name_input');
		const titleLabel = screen.getByText(/It describes the subject of the Group/i);
		const descriptionLabel = screen.getByText(/It describes the subject of the Group/i);
		expect(descriptionLabel).toHaveAttribute('color', 'secondary');
		expect(titleLabel).toHaveAttribute('color', 'secondary');
		expect(editButton).not.toBeEnabled();

		// if I write something inside the title field everything should work fine
		await user.type(nameInput, 'A new name');

		const titleLabel2 = screen.getByText(/It is required and identifies the Group/i);
		expect(titleLabel2).toBeInTheDocument();
		expect(titleLabel2).toHaveAttribute('color', 'primary');
		expect(editButton).toBeEnabled();

		// if I write a title longer than 128 characters the title input shound be in error state with the description input
		await user.type(
			nameInput,
			"This is a sentence with the purpose of testing if the control inside new title's input is working correctly or not, that's why!!!"
		);
		const titleLabel3 = screen.getByText(/Maximum title length is 128 characters/i);
		expect(titleLabel3).toBeInTheDocument();
		expect(titleLabel3).toHaveAttribute('color', 'error');
		expect(editButton).not.toBeEnabled();
	});
	test('Errors on input fields - description', async () => {
		// setup of the room
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		const editButton = screen.getByTestId('edit_button');
		const descriptionInput = screen.getByTestId('description_input');

		// the state should change if I write a description longer than 256 characters, the description input shound be in error state
		await user.type(
			descriptionInput,
			"This is a long description that is useful for testing purpose. We need to check if the length of the sentence will trigger the error inside the modal, that's why we have to write this. I hope that this won't break the test because it would be stressful!!!!"
		);
		const descriptionLabel = screen.getByText(/Maximum topic length is 256 characters/i);
		expect(descriptionLabel).toBeInTheDocument();
		expect(descriptionLabel).toHaveAttribute('color', 'error');
		expect(editButton).not.toBeEnabled();
	});

	test('Errors on input fields', async () => {
		// setup of the room
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		// inside testRoom, the title field is empty, that's why the title input shound be in error state
		const editButton = screen.getByTestId('edit_button');
		const nameInput = screen.getByTestId('name_input');
		const titleLabel = screen.getByText(/It describes the subject of the Group/i);
		const descriptionLabel = screen.getByText(/It describes the subject of the Group/i);
		expect(descriptionLabel).toHaveAttribute('color', 'secondary');
		expect(titleLabel).toHaveAttribute('color', 'secondary');
		expect(editButton).not.toBeEnabled();

		// if I write something inside the title field everything should work fine
		await user.type(nameInput, 'A new name');

		const titleLabel2 = screen.getByText(/It is required and identifies the Group/i);
		expect(titleLabel2).toBeInTheDocument();
		expect(titleLabel2).toHaveAttribute('color', 'primary');
		expect(editButton).toBeEnabled();

		// if I write a title longer than 128 characters the title input shound be in error state with the description input
		await user.type(
			nameInput,
			"This is a sentence with the purpose of testing if the control inside new title's input is working correctly or not, that's why!!!"
		);
		const titleLabel3 = screen.getByText(/Maximum title length is 128 characters/i);
		expect(titleLabel3).toBeInTheDocument();
		expect(titleLabel3).toHaveAttribute('color', 'error');
		expect(editButton).not.toBeEnabled();
	});
	test('Errors on input fields - description', async () => {
		// setup of the room
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		const editButton = screen.getByTestId('edit_button');
		const descriptionInput = screen.getByTestId('description_input');

		// the state should change if I write a description longer than 256 characters, the description input shound be in error state
		await user.type(
			descriptionInput,
			"This is a long description that is useful for testing purpose. We need to check if the length of the sentence will trigger the error inside the modal, that's why we have to write this. I hope that this won't break the test because it would be stressful!!!!"
		);
		const descriptionLabel = screen.getByText(/Maximum topic length is 256 characters/i);
		expect(descriptionLabel).toBeInTheDocument();
		expect(descriptionLabel).toHaveAttribute('color', 'error');
		expect(editButton).not.toBeEnabled();
	});
	test('user modify a field and press edit button', async () => {
		mockedUpdateRoomRequest.mockReturnValue({
			id: testRoom.id,
			name: testRoom.name,
			description: 'This is a new description',
			type: RoomType.GROUP,
			members: [createMockMember({ userId: 'myId' })]
		});
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(
			<EditConversationModal editModalOpen closeModal={jest.fn} roomId={testRoom.id} />
		);
		const descriptionInput = screen.getByTestId('description_input');
		await user.type(descriptionInput, 'This is a new description');
		const editButton = screen.getByTestId('edit_button');
		expect(editButton).toBeEnabled();
	});
});
