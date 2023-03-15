/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { setup } from 'test-utils';

import { mockedAddRoomRequest, mockedAutoCompleteGalRequest } from '../../../jest-mocks';
import { ContactMatch } from '../../network/soap/AutoCompleteRequest';
import useStore from '../../store/Store';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import ChatCreationModal from './ChatCreationModal';

// Mock objects
const zimbraUser1: ContactMatch = {
	email: 'user1@test.com',
	firstName: 'User',
	fullName: 'User One',
	lastName: 'One',
	zimbraId: 'user1-id'
};

const zimbraUser2: ContactMatch = {
	email: 'user2@test.com',
	firstName: 'User',
	fullName: 'User Two',
	lastName: 'Two',
	zimbraId: 'user2-id'
};

const testRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.ONE_TO_ONE,
	members: [
		createMockMember({ userId: 'myId' }),
		createMockMember({ userId: zimbraUser1.zimbraId })
	]
});

describe('Chat Creation Modal', () => {
	test('All elements are rendered', async () => {
		setup(<ChatCreationModal open onClose={jest.fn()} />);

		const title = await screen.findByText('New Chat');
		expect(title).toBeInTheDocument();
		const description = await screen.findByText(
			'Chats are one-to-one conversations that help you to stay in touch with your contacts. You can create a group by including more than two participants'
		);
		expect(description).toBeInTheDocument();
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeInTheDocument();
		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).toBeInTheDocument();
		expect(footerButton).toHaveAttribute('disabled');
	});

	test('Create a Chat', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);

		// Add Chip on ChipInput
		const userComponent = await screen.findByText(zimbraUser1.fullName);
		await user.click(userComponent);

		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).not.toHaveAttribute('disabled', true);

		mockedAddRoomRequest.mockReturnValue({
			id: 'room-id',
			name: ' ',
			description: 'description',
			type: RoomType.ONE_TO_ONE,
			hash: 'hash',
			createdAt: 'created',
			updatedAt: 'updated',
			pictureUpdatedAt: 'pictureUpdatedAt'
		});
		await user.click(footerButton);
	});

	test('Create a group', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);

		// Add group title
		const titleInput = screen.getByRole('textbox', { name: /title/i });
		await user.type(titleInput, 'Title');
		expect(screen.getByDisplayValue(/Title/i)).toBeInTheDocument();

		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).toBeEnabled();

		mockedAddRoomRequest.mockReturnValue({
			id: 'room-id',
			name: 'name',
			description: 'description',
			type: RoomType.GROUP,
			hash: 'hash',
			createdAt: 'created',
			updatedAt: 'updated',
			pictureUpdatedAt: 'pictureUpdatedAt'
		});
		await user.click(footerButton);
		expect(footerButton).not.toHaveAttribute('disabled', true);
	});

	test('title and topic fields are filled properly', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);
		const footerButton = await screen.findByTestId('create_button');

		const titleInput = screen.getByTestId('name_input');
		await user.type(titleInput, 'Group Title');
		expect(screen.getByDisplayValue(/Group Title/i)).toBeInTheDocument();

		const topicInput = screen.getByTestId('description_input');
		await user.type(topicInput, 'Group Description');
		expect(screen.getByDisplayValue(/Group Description/i)).toBeInTheDocument();

		expect(footerButton).toBeEnabled();
	});

	test('Error on title input', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);
		const footerButton = await screen.findByTestId('create_button');

		const titleInput = screen.getByTestId('name_input');
		await user.type(
			titleInput,
			"This is a sentence with the purpose of testing if the control inside new title's input is working correctly or not, that's why!!!"
		);
		const titleLabel = screen.getByText(/Maximum title length is 128 characters/i);
		expect(titleLabel).toBeInTheDocument();
		expect(titleLabel).toHaveAttribute('color', 'error');
		expect(footerButton).not.toBeEnabled();
	});

	test('Error on topic input', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);
		const footerButton = await screen.findByTestId('create_button');

		const topicInput = screen.getByTestId('description_input');
		await user.type(
			topicInput,
			"This is a long description that is useful for testing purpose. We need to check if the length of the sentence will trigger the error inside the modal, that's why we have to write this. I hope that this won't break the test because it would be stressful!!!!!"
		);
		const topicLabel = screen.getByText(/Maximum topic length is 256 characters/i);
		expect(topicLabel).toBeInTheDocument();
		expect(topicLabel).toHaveAttribute('color', 'error');
		expect(footerButton).not.toBeEnabled();
	});

	test('Try to create an already existent Chat', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom));

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		// Add zimbraUser1 to ChipInput
		const userComponent = await screen.findByText(zimbraUser1.fullName);
		await user.click(userComponent);

		const footerButton = await screen.findByTestId('create_button');
		await user.click(footerButton);
	});
});

// Useful debug functions for test
// screen.logTestingPlaygroundURL()
// console.log(prettyDOM(element))
// screen.debug()
