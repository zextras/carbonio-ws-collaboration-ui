/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import ConversationSearchPanel from './ConversationSearchPanel';
import { chatClient } from '../../../network/chatClient/ChatClient';
import { xmppClient } from '../../../network/xmpp/XMPPClient';
import useStore from '../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { mockIntersectionObserverObserve } from '../../../tests/setupTests';
import { screen, setup, triggerObserver } from '../../../tests/test-utils';
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
	store.setLoginInfo({ id: loggedUser.id, name: loggedUser.name });
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

	describe('Paging', () => {
		const sentinelId = 'searchResultsSentinel';
		const pageResult = (id: string): ReturnType<typeof createMockTextMessage> =>
			createMockTextMessage({ id, roomId: groupRoom.id, from: user2.id, text: `text of ${id}` });

		const searchWithFirstPage = async (hasMore: boolean): Promise<ReturnType<typeof setup>> => {
			vi.spyOn(chatClient, 'fullTextSearch').mockImplementation((roomId) => {
				useStore.getState().setSearchResults(roomId, [pageResult('r1'), pageResult('r2')]);
				useStore.getState().setSearchHasMore(roomId, hasMore);
				return Promise.resolve();
			});
			const rendered = setup(
				<ConversationSearchPanel roomId={groupRoom.id} goToChatView={vi.fn()} />
			);
			await rendered.user.type(screen.getByRole('textbox', { name: /search messages/i }), 'query');
			await rendered.user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
			return rendered;
		};

		test('renders no sentinel when the server has no more results', async () => {
			await searchWithFirstPage(false);

			expect(screen.getByText('text of r2')).toBeVisible();
			expect(screen.queryByTestId(sentinelId)).not.toBeInTheDocument();
		});

		test('loads the next page with the active query when the sentinel comes into view, until the last one', async () => {
			const nextPage = vi
				.spyOn(chatClient, 'fullTextSearchNextPage')
				.mockImplementation((roomId) => {
					useStore.getState().appendSearchResults(roomId, [pageResult('r3')]);
					useStore.getState().setSearchHasMore(roomId, false);
					return Promise.resolve();
				});
			await searchWithFirstPage(true);

			await triggerObserver(screen.getByTestId(sentinelId));

			expect(nextPage).toHaveBeenCalledExactlyOnceWith(groupRoom.id, 'query');
			expect(await screen.findByText('text of r3')).toBeVisible();
			expect(screen.queryByTestId(sentinelId)).not.toBeInTheDocument();
		});

		test('does not ask again after a failed page and shows the error snackbar', async () => {
			const nextPage = vi
				.spyOn(chatClient, 'fullTextSearchNextPage')
				.mockRejectedValue(new Error('page failed'));
			await searchWithFirstPage(true);

			await triggerObserver(screen.getByTestId(sentinelId));

			expect(
				await screen.findByText(/Something went wrong with the search. Please try again./i)
			).toBeVisible();
			expect(nextPage).toHaveBeenCalledTimes(1);
			expect(screen.getByText('text of r2')).toBeVisible();
		});

		test('observes the sentinel that mounts after the results landed while the search was still running', async () => {
			// The shell hands out a stable tracker; the file mock builds a new one at every render, which
			// re-runs any effect that depends on it and hides the bug
			const stableTracker = { capture: vi.fn(), enableTracker: vi.fn(), reset: vi.fn() };
			vi.spyOn(shell, 'useTracker').mockReturnValue(stableTracker);
			let finishSearch: () => void = () => undefined;
			// The real order: the page lands in the store, the request settles later
			vi.spyOn(chatClient, 'fullTextSearch').mockImplementation((roomId) => {
				useStore.getState().setSearchResults(roomId, [pageResult('r1'), pageResult('r2')]);
				useStore.getState().setSearchHasMore(roomId, true);
				return new Promise<void>((resolve) => {
					finishSearch = resolve;
				});
			});
			const nextPage = vi.spyOn(chatClient, 'fullTextSearchNextPage').mockResolvedValue(undefined);
			const { user } = setup(
				<ConversationSearchPanel roomId={groupRoom.id} goToChatView={vi.fn()} />
			);
			await user.type(screen.getByRole('textbox', { name: /search messages/i }), 'query');
			await user.click(screen.getByRoleWithIcon('button', { icon: searchedIcon }));
			expect(screen.queryByTestId(sentinelId)).not.toBeInTheDocument();

			await act(async () => {
				finishSearch();
				await Promise.resolve();
			});

			const sentinel = screen.getByTestId(sentinelId);
			expect(mockIntersectionObserverObserve).toHaveBeenCalledWith(sentinel);
			await triggerObserver(sentinel);
			expect(nextPage).toHaveBeenCalledExactlyOnceWith(groupRoom.id, 'query');
		});

		test('clearing the search removes the sentinel', async () => {
			const { user } = await searchWithFirstPage(true);
			expect(screen.getByTestId(sentinelId)).toBeInTheDocument();

			await user.click(screen.getByRoleWithIcon('button', { icon: clearSearchIcon }));

			expect(screen.queryByTestId(sentinelId)).not.toBeInTheDocument();
		});
	});
});
