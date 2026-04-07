/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useRef } from 'react';

import { screen } from '@testing-library/react';

import UserPopoverList, { UserPopoverListProps } from './UserPopoverList';
import useStore from '../../../store/Store';
import { createMockUser } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';

const sessionUser = createMockUser({ id: 'sessionUserId' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });

const RefComponent = (props: Omit<UserPopoverListProps, 'anchorEl'>): ReactElement => {
	const ref = useRef(null);
	return (
		<>
			<div data-testid="clickableDiv" ref={ref} />
			<UserPopoverList anchorEl={ref} {...props} />
		</>
	);
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.email });
	store.setUserInfo([user1, user2]);
});

describe('UserPopoverList test', () => {
	test('Display list on anchorEl click', async () => {
		const { user } = setup(<RefComponent userList={[user1.id, user2.id]} />);
		await user.click(screen.getByTestId('clickableDiv'));
		expect(screen.getByText('User 1')).toBeInTheDocument();
		expect(screen.getByText('User 2')).toBeInTheDocument();
	});

	test('Display icon and title on top of the userlist', async () => {
		const { user } = setup(
			<RefComponent userList={[user1.id, user2.id]} title="Test" icon="Smile" />
		);
		await user.click(screen.getByTestId('clickableDiv'));
		expect(screen.getByText('Test')).toBeInTheDocument();
		expect(screen.getByTestId('icon: Smile')).toBeInTheDocument();
	});

	test('Show You label instead of name for session user', async () => {
		const { user } = setup(<RefComponent userList={[sessionUser.id, user1.id]} />);
		await user.click(screen.getByTestId('clickableDiv'));
		expect(screen.getByText('You')).toBeInTheDocument();
	});
});
