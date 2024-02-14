/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import ChatCreationContactsSelection from './ChatCreationContactsSelection';
import { ContactMatch } from '../../../network/soap/AutoCompleteRequest';
import useStore from '../../../store/Store';
import { createMockCapabilityList } from '../../../tests/createMock';
import { mockedAutoCompleteGalRequest } from '../../../tests/mocks/AutoCompleteGal';
import { setup } from '../../../tests/test-utils';
import { Member } from '../../../types/store/RoomTypes';

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

describe('Chat Creation Modal Contact Selector - search', () => {
	test('All elements are rendered', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 3 })));
		mockedAutoCompleteGalRequest.mockReturnValue([]);

		setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
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

		expect(screen.getByText('Select more than an address to create a Group')).toBeVisible();
	});

	test('Search user on Creation Modal', async () => {
		// Set first AutoCompleteRequest response to []
		mockedAutoCompleteGalRequest.mockReturnValueOnce([]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
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
		const userNameComponent = screen.getByText(zimbraUser1.fullName);
		expect(userNameComponent).toBeVisible();
		const userEmailComponent = screen.getByText(zimbraUser1.email);
		expect(userEmailComponent).toBeVisible();
	});

	test('Search user fails', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
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
				inputRef={React.createRef()}
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
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, `${zimbraUser1.firstName} ${zimbraUser1.lastName}`);
		expect(screen.getByText(/User One/i)).toBeInTheDocument();
		expect(screen.getByText(zimbraUser1.email)).toBeInTheDocument();
	});

	test('Search an user with logged user inside the response', async () => {
		useStore.getState().setLoginInfo(zimbraUser1.zimbraId, zimbraUser1.fullName);
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1, zimbraUser2]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, `User`);
		expect(screen.queryByText(/User One/i)).not.toBeInTheDocument();
		expect(screen.queryByText(zimbraUser1.email)).not.toBeInTheDocument();
		// User Two is present because is not the logged user
		expect(screen.getByText(/User Two/i)).toBeInTheDocument();
		expect(screen.getByText('user2@test.com')).toBeInTheDocument();
	});

	test('Add and remove chip by clicking different components', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
			/>
		);
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeInTheDocument();

		const userComponent = screen.getByText(zimbraUser1.fullName);
		user.click(userComponent);

		await screen.findByTestId('chip_input_creation_modal');

		const name = await screen.findAllByText(`${zimbraUser1.firstName} ${zimbraUser1.lastName}`);
		// here I check that the chip exist and is the one related to user1
		await waitFor(() => expect(name).toHaveLength(2));

		const removeButton = await screen.findByTestId('icon: Close');
		user.click(removeButton);

		await screen.findByTestId('chip_input_creation_modal');

		const nameUpdated = await screen.findAllByText(
			`${zimbraUser1.firstName} ${zimbraUser1.lastName}`
		);

		// the chip should not be in the document
		expect(nameUpdated).toHaveLength(1);
	});

	test('Add and remove chip by clicking the same component', async () => {
		mockedAutoCompleteGalRequest.mockReturnValueOnce([zimbraUser1]);

		const { user } = setup(
			<ChatCreationContactsSelection
				isCreationModal
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
			/>
		);
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeInTheDocument();

		const userComponent = await screen.findByText(zimbraUser1.fullName);
		user.click(userComponent);
		const name = await screen.findAllByText(`${zimbraUser1.firstName} ${zimbraUser1.lastName}`);

		await waitFor(() => expect(name).toHaveLength(1));

		user.click(userComponent);

		await screen.findByTestId('chip_input_creation_modal');

		const nameUpdated = await screen.findAllByText(
			`${zimbraUser1.firstName} ${zimbraUser1.lastName}`
		);

		// the chip should not be in the document
		expect(nameUpdated).toHaveLength(1);
	});
});

describe('Add participant Modal Contact Selector', () => {
	test('All elements are rendered', async () => {
		mockedAutoCompleteGalRequest.mockReturnValue([]);

		setup(
			<ChatCreationContactsSelection
				contactsSelected={{}}
				setContactSelected={jest.fn()}
				inputRef={React.createRef()}
			/>
		);

		// Render ChipInput
		const chipInput = screen.getByText(/Start typing or pick an address/i);
		expect(chipInput).toBeVisible();

		// Render ListItem (after autoCompleteGalRequest)
		await waitFor(() => {
			const list = screen.getByTestId('list_creation_modal');
			expect(list).toBeVisible();
		});

		expect(
			screen.queryByText('Select more than an address to create a Group')
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
				inputRef={React.createRef()}
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

		// AutoCompleteRequest return zimbraUser1 and zimbraUser2, but we can see only zimbraUser2
		expect(list.children).toHaveLength(1);
		const user1Component = screen.queryByText(zimbraUser1.fullName);
		expect(user1Component).not.toBeInTheDocument();
		const user2Component = screen.getByText(zimbraUser2.fullName);
		expect(user2Component).toBeVisible();
	});
});
