/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import GalListItem from './GalListItem';
import { ContactMatch } from '../../../../network/soap/AutoCompleteRequest';
import { setup } from '../../../../tests/test-utils';

const contact: ContactMatch = {
	email: 'contact@test.com',
	firstName: 'Contact',
	lastName: 'Test',
	fullName: 'Contact Test',
	zimbraId: '1234567890'
};

describe('GalListItem tests', () => {
	test('Expanded GalListItem shows avatar and username', () => {
		setup(<GalListItem contact={contact} expanded />);
		const avatar = screen.getByTestId(`${contact.fullName}-avatar`);
		expect(avatar).toBeInTheDocument();
	});

	test('Collapsed GalListItem shows avatar but not the username', () => {
		setup(<GalListItem contact={contact} expanded={false} />);
		const avatar = screen.getByTestId(`${contact.fullName}-avatar`);
		expect(avatar).toBeInTheDocument();
	});
});
