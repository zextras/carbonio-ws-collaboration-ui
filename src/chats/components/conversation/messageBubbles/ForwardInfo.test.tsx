/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ForwardInfo from './ForwardInfo';
import useStore from '../../../../store/Store';
import { createMockTextMessage, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { UserBe } from '../../../../types/network/models/userBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const forwardedUser: UserBe = createMockUser({ id: 'forwardedUserId', name: 'User' });

const textMessage = createMockTextMessage({ from: forwardedUser.id });
const forwardedInfo = {
	id: textMessage.id,
	date: textMessage.date,
	from: textMessage.from,
	count: 1
};

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(forwardedUser);
});
describe('Forward Info', () => {
	test('ForwardInfo contains original sender name', () => {
		setup(<ForwardInfo info={forwardedInfo} />);
		const userName = screen.getByText(new RegExp(forwardedUser.name, 'i'));
		expect(userName).toBeInTheDocument();
	});

	test("Message forwarded once hasn't ReplyAll icon", () => {
		setup(<ForwardInfo info={forwardedInfo} />);

		const forwardMultipleTimesIcon = screen.queryByTestId('icon: ForwardMultipleTimes');
		expect(forwardMultipleTimesIcon).not.toBeInTheDocument();
	});

	test('Message forwarded more than once has ReplyAll icon', () => {
		setup(<ForwardInfo info={{ ...forwardedInfo, count: 3 }} />);

		const forwardMultipleTimesIcon = screen.getByTestId('icon: ForwardMultipleTimes');
		expect(forwardMultipleTimesIcon).toBeInTheDocument();
	});
});
