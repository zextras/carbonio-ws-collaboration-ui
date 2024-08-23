/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import GalListItem from './GalListItem';
import useStore from '../../../../store/Store';
import { setup } from '../../../../tests/test-utils';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';

const contact: ContactInfo = {
	email: 'contact@test.com',
	displayName: 'Contact Test',
	id: '1234567890'
};

describe('GalListItem tests', () => {
	test('Expanded GalListItem shows avatar and username', () => {
		setup(<GalListItem contact={contact} expanded />);
		const avatar = screen.getByTestId(`${contact.displayName}-avatar`);
		expect(avatar).toBeInTheDocument();

		const username = screen.getByText(contact.displayName);
		expect(username).toBeInTheDocument();
	});

	test('Collapsed GalListItem shows avatar but not the username', () => {
		setup(<GalListItem contact={contact} expanded={false} />);
		const avatar = screen.getByTestId(`${contact.displayName}-avatar`);
		expect(avatar).toBeInTheDocument();

		const username = screen.queryByText(contact.displayName);
		expect(username).not.toBeInTheDocument();
	});

	test('User can create a placeholder room by clicking on the GalListItem', () => {
		setup(<GalListItem contact={contact} expanded />);
		const listItem = screen.getByTestId('gal_list_item');
		listItem.click();
		expect(useStore.getState().rooms[`placeholder-${contact.id}`]).toBeDefined();
	});
});
