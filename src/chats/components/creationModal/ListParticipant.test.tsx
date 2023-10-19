/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ListParticipant from './ListParticipant';
import { createMockUser } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';

const contactInfo = createMockUser();

describe('List Participant', () => {
	test('The email of participant list item is selectable', async () => {
		setup(
			<ListParticipant
				item={contactInfo}
				selected={false}
				onClickCb={(): null => null}
				isDisabled={false}
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
				onClickCb={(): null => null}
				isDisabled={false}
			/>
		);
		const contactEmail = screen.getByTestId(`${contactInfo.id}-emailSelectable`);
		expect(contactEmail).not.toHaveStyle('user-select: none');
	});
});