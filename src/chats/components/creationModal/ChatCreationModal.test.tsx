/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import ChatCreationModal from './ChatCreationModal';
import { ContactMatch } from '../../../network/soap/AutoCompleteRequest';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom
} from '../../../tests/createMock';
import { mockedAutoCompleteGalRequest } from '../../../tests/mocks/AutoCompleteGal';
import { mockedAddRoomRequest } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

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

const zimbraUser3: ContactMatch = {
	email: 'user3@test.com',
	firstName: 'User',
	fullName: 'User Three',
	lastName: 'Three',
	zimbraId: 'user3-id'
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
			'Chats are one-to-one conversations that help you to stay in touch with your contacts. You can create a Group by including more than two addresses'
		);
		expect(description).toBeInTheDocument();
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeInTheDocument();
		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).toBeInTheDocument();
		expect(footerButton).toHaveAttribute('disabled');
	});

	test('Creating a 1to1 Chat add a placeholder room', async () => {
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput, zimbraUser1.fullName[0]);

		// Add Chip on ChipInput
		const userComponent = await screen.findByText(zimbraUser1.fullName);
		user.click(userComponent);

		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).not.toHaveAttribute('disabled', true);

		user.click(footerButton);
		await waitFor(() => expect(footerButton).not.toHaveAttribute('disabled', true));
		const placeholderRoom = useStore.getState().rooms[`placeholder-${zimbraUser1.zimbraId}`];
		expect(placeholderRoom).toEqual(
			expect.objectContaining({
				id: `placeholder-${zimbraUser1.zimbraId}`,
				type: RoomType.ONE_TO_ONE,
				placeholder: true
			})
		);
	});

	test('Create a group', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 5 })));
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		user.click(user1Component);

		// the state here changes, in fact now there's a chip inside the input, so there's need to focus again on it
		const chipInput1 = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput1, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		user.click(user2Component);

		// Add group title
		const titleInput = await screen.findByRole('textbox', { name: /title/i });
		user.type(titleInput, 'Title');
		const title = await screen.findByDisplayValue(/Title/i);
		expect(title).toBeInTheDocument();

		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).toBeEnabled();

		mockedAddRoomRequest.mockReturnValue({
			id: 'room-id',
			name: 'name',
			description: 'description',
			type: RoomType.GROUP,
			createdAt: 'created',
			updatedAt: 'updated',
			pictureUpdatedAt: 'pictureUpdatedAt'
		});
		user.click(footerButton);
		await waitFor(() => expect(footerButton).not.toHaveAttribute('disabled', true));
		expect(mockedAddRoomRequest).toHaveBeenCalled();
	});

	test('Error on creating a group displaying a snackbar', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 5 })));
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Add zimbraUser1 and zimbraUser2 chips
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		user.click(user1Component);
		const chipInput1 = await screen.findByTestId('chip_input_creation_modal');
		user.type(chipInput1, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		user.click(user2Component);

		const footerButton = await screen.findByTestId('create_button');
		expect(footerButton).toBeEnabled();

		mockedAddRoomRequest.mockRejectedValueOnce({});
		user.click(footerButton);
		await waitFor(() => expect(footerButton).not.toHaveAttribute('disabled', true));
		const snackbar = await screen.findByText(/Something went Wrong. Please Retry/i);
		expect(snackbar).toBeInTheDocument();
	});

	test('title and topic fields are filled properly', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 5 })));
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

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
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);
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
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);

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

	test('Check creation disabled if user reach the limit available, and check list checkbox are disabled', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 3 })));
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2, zimbraUser3]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);
		const usersToAddLimitReached = await screen.findByText(
			'You have selected the maximum number of members for a group'
		);
		await user.type(chipInput, zimbraUser3.fullName[0]);
		const user3Checkbox = screen.getByTestId('icon: Square');
		expect(user3Checkbox).toBeInTheDocument();
		expect(user3Checkbox).toHaveAttribute('disabled');
		expect(usersToAddLimitReached).toBeInTheDocument();
	});

	test('Check list checkbox are enabled when user can add other members', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 4 })));
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2, zimbraUser3]);
		const { user } = setup(<ChatCreationModal open onClose={jest.fn()} />);
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);
		const user1Component = await screen.findByText(zimbraUser1.fullName);
		await user.click(user1Component);
		await user.type(chipInput, zimbraUser2.fullName[0]);
		const user2Component = await screen.findByText(zimbraUser2.fullName);
		await user.click(user2Component);
		await user.type(chipInput, zimbraUser3.fullName[0]);
		const user3Checkbox = screen.getByTestId('icon: Square');
		expect(user3Checkbox).toBeInTheDocument();
		expect(user3Checkbox).not.toHaveAttribute('disabled');
	});
});

// Useful debug functions for test
// screen.logTestingPlaygroundURL()
// console.log(prettyDOM(element))
// screen.debug()
