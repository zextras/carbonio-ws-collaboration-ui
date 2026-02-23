/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState } from 'react';

import { screen, waitFor, within } from '@testing-library/react';

import ContactsSelector from './ContactsSelector';
import { mockSearchUsersByFeatureRequest } from '../../../network/soap/__mocks__/SearchUsersByFeatureRequest';
import { setup } from '../../../tests/test-utils';
import { ContactInfo } from '../../../types/network/soap/searchUsersByFeatureRequest';

const user1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User One',
	id: 'user1-id'
};

const iconCrown = 'icon: Crown';

const MockComponent = ({ owner }: { owner?: boolean }): React.ReactElement => {
	const [contactsSelected, setContactSelected] = useState<ContactInfo[]>([]);
	return (
		<ContactsSelector
			contactsSelected={contactsSelected}
			setContactSelected={setContactSelected}
			canSelectOwnership={owner}
		/>
	);
};

vi.mock('../../../network/soap/SearchUsersByFeatureRequest');

describe('ContactsSelector', () => {
	test('Initial request has a result', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		setup(<ContactsSelector contactsSelected={[]} setContactSelected={vi.fn()} />);
		expect(screen.getByTestId('chip_input_contact_selector')).toBeInTheDocument();
		expect(await screen.findByTestId('list_contacts')).toBeInTheDocument();
	});

	test('Initial request has no result', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [] });
		setup(<ContactsSelector contactsSelected={[]} setContactSelected={vi.fn()} />);
		expect(screen.getByTestId('chip_input_contact_selector')).toBeInTheDocument();
		expect(
			await screen.findByText('There are no items that match this search in your company.')
		).toBeInTheDocument();
	});

	test('Clicking on a user adds it to the list of selected users', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		const { user } = setup(<MockComponent />);
		await user.click(await screen.findByText(user1.displayName));
		expect(await screen.findAllByText(user1.displayName)).toHaveLength(2);
	});

	test('Clicking on a user already selected removes it from the list of selected users', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		const { user } = setup(<MockComponent />);
		const listUser = await within(await screen.findByTestId('list_contacts')).findByText(
			user1.displayName
		);
		await user.click(listUser);
		await user.click(listUser);
		expect(await screen.findAllByText(user1.displayName)).toHaveLength(1);
	});

	test('Clicking on close icon on chip removes the user from the list of selected users', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		const { user } = setup(<MockComponent />);
		await user.click(await screen.findByText(user1.displayName));
		const closeOnChip = await within(
			screen.getByTestId('chip_input_contact_selector')
		).findByTestId('icon: Close');
		await user.click(closeOnChip);
		expect(await screen.findAllByText(user1.displayName)).toHaveLength(1);
	});

	test('Select a user and make him owner clicking icon on the list', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		const { user } = setup(<MockComponent owner />);
		const listUser = await screen.findByText(user1.displayName);
		await user.click(listUser);
		const outlineCrownIconOnList = await within(
			await screen.findByTestId('list_contacts')
		).findByTestId('icon: CrownOutline');
		await user.click(outlineCrownIconOnList);

		const crownIconOnList = await within(await screen.findByTestId('list_contacts')).findByTestId(
			iconCrown
		);
		expect(crownIconOnList).toBeInTheDocument();
		const crownIconOnChip = await within(
			screen.getByTestId('chip_input_contact_selector')
		).findByTestId(iconCrown);
		expect(crownIconOnChip).toBeInTheDocument();
	});

	test('Select a user and make him owner clicking icon on the chip', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1] });
		const { user } = setup(<MockComponent owner />);
		const listUser = await screen.findByText(user1.displayName);
		await user.click(listUser);
		const outlineCrownIconOnChip = await within(
			await screen.findByTestId('chip_input_contact_selector')
		).findByTestId('icon: CrownOutline');
		await user.click(outlineCrownIconOnChip);

		const crownIconOnList = await within(await screen.findByTestId('list_contacts')).findByTestId(
			iconCrown
		);
		expect(crownIconOnList).toBeInTheDocument();
		const crownIconOnChip = await within(
			screen.getByTestId('chip_input_contact_selector')
		).findByTestId(iconCrown);
		expect(crownIconOnChip).toBeInTheDocument();
	});

	test('If there are more contacts, clicking on "Show more users" loads more contacts', async () => {
		mockSearchUsersByFeatureRequest.mockResolvedValueOnce({
			contacts: [user1],
			more: true
		});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { user } = setup(<MockComponent />);

		await waitFor(() => {
			expect(screen.getByText('Show more users')).toBeInTheDocument();
		});
		await user.click(screen.getByText('Show more users'));
		await waitFor(() => {
			expect(mockSearchUsersByFeatureRequest).toHaveBeenCalledTimes(2);
		});
	});
});
