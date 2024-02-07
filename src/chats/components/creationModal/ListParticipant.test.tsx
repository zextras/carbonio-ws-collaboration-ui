/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ListParticipant from './ListParticipant';
import useStore from '../../../store/Store';
import { createMockUser } from '../../../tests/createMock';
import { mockedGetURLUserPicture } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';

const contactInfo = createMockUser();

describe('List Participant', () => {
	test('The email of participant list item is selectable', async () => {
		setup(
			<ListParticipant
				item={contactInfo}
				selected={false}
				onClickCb={(): undefined => undefined}
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
				onClickCb={(): undefined => undefined}
				isDisabled={false}
			/>
		);
		const contactEmail = screen.getByTestId(`${contactInfo.id}-emailSelectable`);
		expect(contactEmail).not.toHaveStyle('user-select: none');
	});

	test('Show user picture if user has one', () => {
		const store = useStore.getState();
		store.setUserInfo(createMockUser({ pictureUpdatedAt: '2022-01-01' }));
		setup(
			<ListParticipant
				item={contactInfo}
				selected={false}
				onClickCb={(): undefined => undefined}
				isDisabled={false}
			/>
		);
		expect(mockedGetURLUserPicture).toBeCalled();
	});
});
