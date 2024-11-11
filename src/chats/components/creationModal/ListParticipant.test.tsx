/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ListParticipant from './ListParticipant';
import { setup } from '../../../tests/test-utils';
import { ContactInfo } from '../../../types/network/soap/searchUsersByFeatureRequest';

const contactInfo: ContactInfo = {
	email: 'test@user.com',
	displayName: 'Test User',
	id: '1234567890'
};

const mockIsOwner = (id: string): boolean => {
	console.log(id);
	return true;
};
const mockUpdateOwner = (id: string): void => {
	console.log(id);
};

describe('List Participant', () => {
	test('The email of participant list item is selectable', async () => {
		setup(
			<ListParticipant
				item={contactInfo}
				selected={false}
				onClickCb={(): undefined => undefined}
				isDisabled={false}
				isOwner={mockIsOwner}
				updateOwner={mockUpdateOwner}
				canBeModerator
			/>
		);
		const contactEmail = screen.getByTestId(`${contactInfo.id}-emailSelectable`);
		expect(contactEmail).toHaveStyle('user-select: text');
	});
	test('The email of participant list item must not be not selectable', async () => {
		setup(
			<ListParticipant
				item={contactInfo}
				selected={false}
				onClickCb={(): undefined => undefined}
				isDisabled={false}
				isOwner={mockIsOwner}
				updateOwner={mockUpdateOwner}
				canBeModerator
			/>
		);
		const contactEmail = screen.getByTestId(`${contactInfo.id}-emailSelectable`);
		expect(contactEmail).not.toHaveStyle('user-select: none');
	});
});
