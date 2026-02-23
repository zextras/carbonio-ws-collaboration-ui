/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import ConversationSearchPanel from './ConversationSearchPanel';
import useStore from '../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { User } from '../../../types/store/UserTypes';
import { formatDate } from '../../../utils/dateUtils';

const loggedUser: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const user2: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
});
const members = [
	createMockMember({ userId: loggedUser.id, owner: true }),
	createMockMember({ userId: user2.id })
];

const groupRoom: RoomBe = createMockRoom({
	id: 'groud-id',
	name: 'Name of the group',
	type: RoomType.GROUP,
	members
});

const oneToOneRoom: RoomBe = createMockRoom({
	id: 'single-id',
	type: RoomType.ONE_TO_ONE,
	members
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo([loggedUser, user2]);
	store.addRooms([groupRoom, oneToOneRoom]);
});

const searchedIcon = 'icon: Search';
const clearSearchIcon = 'icon: BackspaceOutline';

describe('ConversationSearchPanel', () => {
	test('should render "Search messages with {userName} on one to one conversation', () => {
		const goToChatViewFn = vi.fn();
		setup(<ConversationSearchPanel roomId={oneToOneRoom.id} goToChatView={goToChatViewFn} />);
		expect(screen.getByText(`Search messages with ${user2.name}`)).toBeVisible();
	});

	test('should render the search panel', () => {
		const goToChatViewFn = vi.fn();
		setup(<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />);

		expect(screen.getByRole('textbox', { name: /search messages/i })).toBeVisible();
		const searchButton = screen.getByRoleWithIcon('button', { icon: searchedIcon });
		expect(searchButton).toBeVisible();
		expect(searchButton).toBeDisabled();
		expect(screen.queryByRoleWithIcon('button', { icon: clearSearchIcon })).not.toBeInTheDocument();
		expect(screen.getAllByTestId(searchedIcon)).toHaveLength(2);
		expect(screen.getByText(`Search messages in ${groupRoom.name}`)).toBeVisible();
	});

	test('should enable the search button and render the clear button when the user starts typing', async () => {
		const goToChatViewFn = vi.fn();
		const { user } = setup(
			<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
		);

		await user.type(screen.getByRole('textbox', { name: /search messages/i }), 'test');
		expect(screen.getByRoleWithIcon('button', { icon: searchedIcon })).toBeEnabled();
		expect(screen.getByRoleWithIcon('button', { icon: clearSearchIcon })).toBeVisible();
	});

	describe('Searched messages', () => {
		test('should render the searched messages when the user types something and click on search button', async () => {
			const goToChatViewFn = vi.fn();
			const textMessage = createMockTextMessage({ from: user2.id });
			useStore.getState().newMessage(textMessage);

			const { xmppClient } = useStore.getState().connections;
			vi.spyOn(xmppClient, 'fullTextSearch').mockImplementation((roomId) => {
				useStore.getState().setSearchResults(roomId, [textMessage]);
				return Promise.resolve();
			});

			useStore.getState().newMessage(textMessage);
			const { user } = setup(
				<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
			);

			await user.type(screen.getByRole('textbox', { name: /search messages/i }), textMessage.text);
			await user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
			expect(screen.getByText(textMessage.text)).toBeVisible();
			expect(screen.getByText(formatDate(textMessage.date, 'DD/MM/YYYY - HH:mm'))).toBeVisible();
			expect(screen.getByText(user2.name)).toBeVisible();
		});

		test('should render the "YOU" on your searched messages', async () => {
			const goToChatViewFn = vi.fn();
			const textMessage = createMockTextMessage({ from: loggedUser.id });
			useStore.getState().newMessage(textMessage);

			const { xmppClient } = useStore.getState().connections;
			vi.spyOn(xmppClient, 'fullTextSearch').mockImplementation((roomId) => {
				useStore.getState().setSearchResults(roomId, [textMessage]);
				return Promise.resolve();
			});

			useStore.getState().newMessage(textMessage);
			const { user } = setup(
				<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
			);

			await user.type(screen.getByRole('textbox', { name: /search messages/i }), textMessage.text);
			await user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
			expect(screen.getByText(textMessage.text)).toBeVisible();
			expect(screen.getByText(formatDate(textMessage.date, 'DD/MM/YYYY - HH:mm'))).toBeVisible();
			expect(screen.getByText(/you/i)).toBeVisible();
		});
	});

	test('should render the no results message if there are no results', async () => {
		const goToChatViewFn = vi.fn();
		const { xmppClient } = useStore.getState().connections;

		vi.spyOn(xmppClient, 'fullTextSearch').mockImplementation((roomId: string) => {
			useStore.getState().setSearchResults(roomId, []);
			return Promise.resolve();
		});

		const { user } = setup(
			<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
		);

		await user.type(screen.getByRole('textbox', { name: /search messages/i }), 'test');
		await user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
		expect(screen.getByText(/It looks like there are no results./i)).toBeVisible();
		expect(screen.getByText(/Keep searching!/i)).toBeVisible();
	});

	test('should clear the input message when the user clicks on clear button', async () => {
		const goToChatViewFn = vi.fn();
		const { user } = setup(
			<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
		);

		const searchInput = screen.getByRole('textbox', { name: /search messages/i });
		await user.type(searchInput, 'test');
		await user.click(screen.getByRoleWithIcon('button', { icon: clearSearchIcon }));
		expect(searchInput).toHaveValue('');
		expect(screen.getByRoleWithIcon('button', { icon: searchedIcon })).toBeDisabled();
		expect(screen.queryByRoleWithIcon('button', { icon: clearSearchIcon })).not.toBeInTheDocument();
	});

	test('should show error snackbar when search fails', async () => {
		const goToChatViewFn = vi.fn();
		const { xmppClient } = useStore.getState().connections;
		vi.spyOn(xmppClient, 'fullTextSearch').mockRejectedValue(new Error('Search failed'));
		const { user } = setup(
			<ConversationSearchPanel roomId={groupRoom.id} goToChatView={goToChatViewFn} />
		);

		await user.type(screen.getByRole('textbox', { name: /search messages/i }), 'test');
		await user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
		expect(
			screen.getByText(/Something went wrong with the search. Please try again./i)
		).toBeVisible();
	});
});
