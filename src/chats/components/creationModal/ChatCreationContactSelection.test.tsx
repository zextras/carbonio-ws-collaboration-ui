/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import ChatCreationContactsSelection from './ChatCreationContactsSelection';
import useStore from '../../../store/Store';
import { createMockCapabilityList } from '../../../tests/createMock';
import { mockSearchUsersByFeatureRequest } from '../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../tests/test-utils';
import { ContactInfo } from '../../../types/network/soap/searchUsersByFeatureRequest';
import { Member } from '../../../types/store/RoomTypes';

// Mock objects
const contactUser1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User One',
	id: 'user1-id'
};

const contactUser2: ContactInfo = {
	email: 'user2@test.com',
	displayName: 'User Two',
	id: 'user2-id'
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

const memberLimits: Array<[string, number, string]> = [
	['0', 2, 'You have selected the maximum number of members for a group'],
	['1', 3, 'You can add one last member'],
	['2', 4, 'You can add other 2 members']
];

describe('Chat Creation Modal Contact Selector - search', () => {
	test('All elements are rendered', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: 3 })));
		mockSearchUsersByFeatureRequest.mockReturnValue([]);

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
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([]);

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
		expect(list.children[0].children).toHaveLength(0);

		// Set [userObj] as returned valued for AutoCompleteRequest
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, contactUser1.displayName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list2 = await screen.findByTestId('list_creation_modal');
		expect(list2).toBeVisible();
		expect(list2.children).toHaveLength(1);

		// Check presence of userObj on the contact list
		const userNameComponent = screen.getByText(contactUser1.displayName);
		expect(userNameComponent).toBeVisible();
		const userEmailComponent = screen.getByText(contactUser1.email);
		expect(userEmailComponent).toBeVisible();
	});

	test('Search user fails', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1, contactUser2]);

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
		expect(list.children[0].children).toHaveLength(2);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, contactUser1.displayName[0]);

		await screen.findByText('spinner');
		const placeholderLabel = await screen.findByText(
			'There are no items that match this search in your company.'
		);
		expect(placeholderLabel).toBeVisible();
	});

	test('Search user fails on first request', async () => {
		// console.error()) is expected
		jest.spyOn(console, 'error').mockImplementation();
		mockSearchUsersByFeatureRequest.mockRejectedValue({ error: 'error' });

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
		expect(list.children[0].children).toHaveLength(0);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, contactUser1.displayName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render the empty contact list
		await screen.findByText('spinner');
		const list2 = await screen.findByTestId('list_creation_modal');
		expect(list2).toBeVisible();
		expect(list2.children[0].children).toHaveLength(0);
	});

	test('Search an user by name and surname', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);

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
		await user.type(chipInput, `${contactUser1.displayName}`);
		expect(screen.getByText(/User One/i)).toBeInTheDocument();
		expect(screen.getByText(contactUser1.email)).toBeInTheDocument();
	});

	test('Search an user with logged user inside the response', async () => {
		useStore.getState().setLoginInfo(contactUser1.id, contactUser1.displayName);
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1, contactUser2]);

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
		expect(screen.queryByText(contactUser1.email)).not.toBeInTheDocument();
		// User Two is present because is not the logged user
		expect(screen.getByText(/User Two/i)).toBeInTheDocument();
		expect(screen.getByText('user2@test.com')).toBeInTheDocument();
	});

	test('Add and remove chip by clicking different components', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);

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

		const userComponent = screen.getByText(contactUser1.displayName);
		user.click(userComponent);

		await screen.findByTestId('chip_input_creation_modal');

		const name = await screen.findAllByText(`${contactUser1.displayName}`);
		// here I check that the chip exist and is the one related to user1
		await waitFor(() => expect(name).toHaveLength(2));

		const removeButton = await screen.findByTestId('icon: Close');
		user.click(removeButton);

		await screen.findByTestId('chip_input_creation_modal');

		const nameUpdated = await screen.findAllByText(`${contactUser1.displayName}`);

		// the chip should not be in the document
		expect(nameUpdated).toHaveLength(1);
	});

	test('Add and remove chip by clicking the same component', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);

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

		const userComponent = await screen.findByText(contactUser1.displayName);
		user.click(userComponent);
		const name = await screen.findAllByText(`${contactUser1.displayName}`);

		await waitFor(() => expect(name).toHaveLength(1));

		user.click(userComponent);

		await screen.findByTestId('chip_input_creation_modal');

		const nameUpdated = await screen.findAllByText(`${contactUser1.displayName}`);

		// the chip should not be in the document
		expect(nameUpdated).toHaveLength(1);
	});
});

describe('Add participant Modal Contact Selector', () => {
	test('All elements are rendered', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValue([]);

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
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([]);

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
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1, contactUser2]);

		// Type on ChipInput to search contactUser2
		const chipInput = await screen.findByTestId('chip_input_creation_modal');
		await user.type(chipInput, contactUser2.displayName[0]);

		// AutoCompleteRequest trigger an initial "Spinner" state and then render contact list
		await screen.findByText('spinner');
		const list = await screen.findByTestId('list_creation_modal');
		expect(list).toBeVisible();

		// AutoCompleteRequest return contactUser1 and contactUser2, but we can see only contactUser2
		expect(list.children).toHaveLength(1);
		const user1Component = screen.queryByText(contactUser1.displayName);
		expect(user1Component).not.toBeInTheDocument();
		const user2Component = screen.getByText(contactUser2.displayName);
		expect(user2Component).toBeVisible();
	});

	test.each(memberLimits)(
		'Check limit of member to add, limit is %s',
		async (k, limit, stringToCheck) => {
			const { result } = renderHook(() => useStore());
			act(() =>
				result.current.setCapabilities(createMockCapabilityList({ maxGroupMembers: limit }))
			);

			setup(
				<ChatCreationContactsSelection
					contactsSelected={{}}
					setContactSelected={jest.fn()}
					members={[user0, user1]}
					inputRef={React.createRef()}
				/>
			);

			const usersToAddLimitReached = await screen.findByText(stringToCheck);
			expect(usersToAddLimitReached).toBeInTheDocument();
		}
	);
});
