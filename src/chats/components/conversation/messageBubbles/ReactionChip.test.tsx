/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ReactionChip from './ReactionChip';
import useStore from '../../../../store/Store';
import { createMockTextMessage, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';

const loggedUser = createMockUser({ id: 'loggedUser', name: 'Logged User' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });
const user3 = createMockUser({ id: 'user3', name: 'User 3' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo([loggedUser, user1, user2, user3]);
});

const chipTestId = 'reaction-chip';

describe('ReactionChip', () => {
	test('Display a reaction sent by one user', () => {
		setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user1.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		expect(screen.getByText('👍')).toBeInTheDocument();
		expect(screen.getByText('U1')).toBeInTheDocument();
	});

	test('User information are available only after the first render', async () => {
		const user4 = createMockUser({ id: 'user4', name: 'User 4' });
		setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user4.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		expect(screen.getByText('👍')).toBeInTheDocument();
		expect(screen.queryByText('U4')).not.toBeInTheDocument();
		act(() => {
			useStore.getState().setUserInfo([user4]);
		});
		expect(await screen.findByText('U4')).toBeInTheDocument();
	});

	test('Display a reaction sent by multiple users', () => {
		setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user1.id, user2.id, user3.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		expect(screen.getByText('👍')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	test('Hovering over the chip shows a tooltip with the names of the users who sent the reaction', async () => {
		const { user } = setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user1.id, user2.id, user3.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		const container = screen.getByTestId(chipTestId);
		await user.hover(container);
		await screen.findByText('User 1, User 2, User 3');
		expect(screen.getByText('User 1, User 2, User 3')).toBeInTheDocument();
	});

	test('Clicking on the chip sends a reaction if session user does not previous send id', async () => {
		const spyOnSendChatMessageReaction = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'sendChatMessageReaction'
		);
		const { user } = setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user1.id, user2.id, user3.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		const container = screen.getByTestId(chipTestId);
		await user.click(container);
		expect(spyOnSendChatMessageReaction).toHaveBeenCalledWith('roomId', 'stanzaId', '\uD83D\uDC4D');
	});

	test('Clicking on the chip that the user sent remove it', async () => {
		const spyOnSendChatMessageReaction = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'sendChatMessageReaction'
		);
		const { user } = setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[loggedUser.id, user2.id, user3.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		const container = screen.getByTestId(chipTestId);
		await user.click(container);
		expect(spyOnSendChatMessageReaction).toHaveBeenCalledWith('roomId', 'stanzaId', '');
	});

	test('Chip changes color when a new reaction is received', async () => {
		const store = useStore.getState();
		store.newMessage(
			createMockTextMessage({ stanzaId: 'stanzaId', roomId: 'roomId', from: loggedUser.id })
		);
		store.setNewReaction('roomId', 'stanzaId', '\uD83D\uDC4D', user1.id);
		setup(
			<ReactionChip
				reaction={'\uD83D\uDC4D'}
				from={[user1.id]}
				roomId={'roomId'}
				stanzaId={'stanzaId'}
			/>
		);
		const container = screen.getByTestId(chipTestId);
		expect(container).toHaveStyle('background: rgb(43, 115, 210)');
	});
});
