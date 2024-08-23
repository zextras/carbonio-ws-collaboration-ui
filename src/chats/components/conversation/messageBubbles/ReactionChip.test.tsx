/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ReactionChip from './ReactionChip';
import useStore from '../../../../store/Store';
import { createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';

const loggedUser = createMockUser({ id: 'loggedUser', name: 'Logged User' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });
const user3 = createMockUser({ id: 'user3', name: 'User 3' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(loggedUser);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
});

describe('ReactionChip', () => {
	test('Display a reaction sent by one user', () => {
		setup(<ReactionChip reaction={'\uD83D\uDC4D'} from={[user1.id]} />);
		expect(screen.getByText('👍')).toBeInTheDocument();
		expect(screen.getByText('U1')).toBeInTheDocument();
	});

	test('Display a reaction sent by multiple users', () => {
		setup(<ReactionChip reaction={'\uD83D\uDC4D'} from={[user1.id, user2.id, user3.id]} />);
		expect(screen.getByText('👍')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	test('Hovering over the chip shows a tooltip with the names of the users who sent the reaction', async () => {
		const { user } = setup(
			<ReactionChip reaction={'\uD83D\uDC4D'} from={[user1.id, user2.id, user3.id]} />
		);
		const container = screen.getByTestId('reaction-chip');
		await user.hover(container);
		await screen.findByText('User 1, User 2, User 3');
		expect(screen.getByText('User 1, User 2, User 3')).toBeInTheDocument();
	});
});
