/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import ChatCreationContactsSelection from './ChatCreationContactsSelection';
import { mockedAutoCompleteGalRequest } from '../../../jest-mocks';
import { ContactMatch } from '../../network/soap/AutoCompleteRequest';
import { Member } from '../../types/store/RoomTypes';

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

const user0: Member = {
	userId: 'user0-id',
	owner: true,
	temporary: false,
	external: false
};

const user1: Member = {
	userId: 'user1-id',
	owner: false,
	temporary: false,
	external: false
};

describe('Chat Creation Modal Contact Selector', () => {
	test('All elements are rendered', async () => {
		mockedAutoCompleteGalRequest.mockReturnValue([]);

		setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);

		// Render ChipInput
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		expect(chipInput).toBeVisible();

		// Render ListItem (after autoCompleteGalRequest)
		await waitFor(() => {
			const list = screen.getByTestId('list_creation_modal');
			expect(list).toBeVisible();
		});

		expect(screen.getByText('Select more that an address to create a group chat')).toBeVisible();
	});

	test('Search user on Creation Modal', async () => {
		// Set first AutoCompleteRequest response to []
		mockedAutoCompleteGalRequest.mockReturnValueOnce([]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);
		// Initial AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();
		expect(list.children).toHaveLength(0);

		// Set [userObj] as returned valued for AutoCompleteRequest
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list2 = await screen.findByTestId('list_creation_modal');
		expect(list2).toBeVisible();
		expect(list2.children).toHaveLength(1);

		// Check presence of userObj on the contact list
		const userComponent = screen.getByText(zimbraUser1.fullName);
		expect(userComponent).toBeVisible();
	});

	test('Add and remove', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);
		await screen.findByTestId('list_creation_modal');

		// Add Chip on ChipInput
		const userComponent = screen.getByText(zimbraUser1.fullName);
		await user.click(userComponent);

		const userComponents = screen.getAllByText(zimbraUser1.fullName);
		expect(userComponents).toHaveLength(2);

		// Remove Chip from ChipInput with x button on chip
		const removeButton = screen.getByTestId('icon: Close');
		await user.click(removeButton);
		const userComponentsAfterRemove = screen.getAllByText(zimbraUser1.fullName);
		expect(userComponentsAfterRemove).toHaveLength(1);

		// Add chip input and remove by clicking the same component
		const userComponent2 = screen.getByText(zimbraUser1.fullName);
		await user.click(userComponent2);
		await user.click(userComponent2);
		const userComponents2AfterRemove = screen.getAllByText(zimbraUser1.fullName);
		expect(userComponents2AfterRemove).toHaveLength(1);
	});

	test('Search user fails', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);

		// Initial AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();
		expect(list.children).toHaveLength(2);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);

		await screen.findByText('spinner');
		const placeholderLabel = await screen.findByText('There are no items that match this search');
		expect(placeholderLabel).toBeVisible();
	});

	test('Search user fails on first request', async () => {
		// console.error()) is expected
		jest.spyOn(console, 'error').mockImplementation();
		mockedAutoCompleteGalRequest.mockRejectedValue({ error: 'error' });

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);

		// Initial AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();
		expect(list.children).toHaveLength(0);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser1.fullName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render the empty contact list
		await screen.findByText('spinner');
		const list2 = await screen.findByTestId('list_creation_modal');
		expect(list2).toBeVisible();
		expect(list2.children).toHaveLength(0);
	});

	test('Search an user by name and surname', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, `${zimbraUser1.firstName} ${zimbraUser1.lastName}`);
		expect(screen.getByDisplayValue(/User One/i)).toBeInTheDocument();
	});
});

describe('Add participant Modal Contact Selector', () => {
	test('All elements are rendered', async () => {
		mockedAutoCompleteGalRequest.mockReturnValue([]);

		setup(<ChatCreationContactsSelection contactsSelected={{}} setContactSelected={jest.fn()} />);

		// Render ChipInput
		const chipInput = screen.getByText(/Start typing or pick an address/i);
		expect(chipInput).toBeVisible();

		// Render ListItem (after autoCompleteGalRequest)
		await waitFor(() => {
			const list = screen.getByTestId('list_creation_modal');
			expect(list).toBeVisible();
		});

		expect(
			screen.queryByText('Select more that an address to create a group chat')
		).not.toBeInTheDocument();
	});

	test('Search user on Add Participant Modal', async () => {
		// Set first AutoCompleteRequest response to []
		mockedAutoCompleteGalRequest.mockReturnValueOnce([]);

		const { user } = setup(
			<ChatCreationContactsSelection
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				members={[user0, user1]}
			/>
		);

		// Initial AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		await screen.findByTestId('list_creation_modal');
		expect(screen.getByTestId('list_creation_modal')).toBeVisible();

		// Set [userObj] as returned valued for AutoCompleteRequest
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		// Type on ChipInput to search zimbraUser2
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, zimbraUser2.fullName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();

		// AutoCompleteRequest return zimbraUser1 and zimbraUser2 but we can see only zimbraUser2
		expect(list.children).toHaveLength(1);
		const user1Component = screen.queryByText(zimbraUser1.fullName);
		expect(user1Component).not.toBeInTheDocument();
		const user2Component = screen.getByText(zimbraUser2.fullName);
		expect(user2Component).toBeVisible();
	});
});
