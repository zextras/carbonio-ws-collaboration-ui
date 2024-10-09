/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import SecondaryBarView from './SecondaryBarView';
import useStore from '../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../types/network/soap/searchUsersByFeatureRequest';
import { RootStore } from '../../../types/store/StoreTypes';

const iconCloseOutline = 'icon: CloseOutline';
const iconFunnelOutline = 'icon: FunnelOutline';
const helloString = 'Hello guys!';

const user1Be = createMockUser({
	id: 'user1Id',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1",
	pictureUpdatedAt: '235968427123'
});

const user2Be = createMockUser({
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
});

const user3Be = createMockUser({
	id: 'user3Id',
	email: 'user3@domain.com',
	name: 'User3',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 3"
});

const mockedGroup1: RoomBe = createMockRoom({
	id: 'mockedGroup1',
	type: RoomType.GROUP,
	name: 'Group of 3 people',
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id }),
		createMockMember({ userId: user3Be.id, owner: true })
	]
});

const mockedGroup2: RoomBe = createMockRoom({
	id: 'mockedGroup2',
	type: RoomType.GROUP,
	name: 'Group of 2 people',
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id })
	]
});

const mockedOneToOne1: RoomBe = createMockRoom({
	id: 'mockedOTO1',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user2Be.id })]
});

const mockedOneToOne2: RoomBe = createMockRoom({
	id: 'mockedOTO2',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user3Be.id })]
});

const mkdTextMsgUser1OneToOne = createMockTextMessage({
	roomId: mockedOneToOne1.id,
	text: helloString,
	from: user1Be.id,
	date: 1704787470 // 2024-01-09 09:04:30
});

const mkdTextMsgUser2OneToOne = createMockTextMessage({
	roomId: mockedOneToOne2.id,
	text: helloString,
	from: user1Be.id,
	date: 1704783870 // 2024-01-09 08:04:30
});

const mkdTextMsgUser3Group1 = createMockTextMessage({
	roomId: mockedGroup1.id,
	text: helloString,
	from: user3Be.id,
	date: 1704780270 // 2024-01-09 07:04:30
});

const mkdTextMsgUser3Group2 = createMockTextMessage({
	roomId: mockedGroup2.id,
	text: helloString,
	from: user2Be.id,
	date: 1704776670 // 2024-01-09 06:04:30
});

const contactUser1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User 1 Test',
	id: '1234567890'
};

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setChatsBeStatus(true);
	store.setLoginInfo(user1Be.id, user1Be.name);
	store.addRoom(mockedGroup1);
	store.addRoom(mockedOneToOne1);
	store.addRoom(mockedGroup2);
	store.addRoom(mockedOneToOne2);
	store.setUserInfo(user1Be);
	store.setUserInfo(user2Be);
	store.setUserInfo(user3Be);
	store.newMessage(mkdTextMsgUser3Group1);
	store.newMessage(mkdTextMsgUser1OneToOne);
	store.newMessage(mkdTextMsgUser2OneToOne);
	store.newMessage(mkdTextMsgUser3Group2);
});
describe('SecondaryBar tests', () => {
	test('Default SecondaryBar contains conversationList', () => {
		setup(<SecondaryBarView expanded />);
		const list = screen.getByTestId('conversations_list_filtered');
		expect(list).toBeInTheDocument();
	});

	test('Default SecondaryBar does not contains galSearchList', () => {
		setup(<SecondaryBarView expanded />);
		const list = screen.queryByTestId('filtered_gal');
		expect(list).not.toBeInTheDocument();
	});

	test('User see the ShimmeringListView when network status is not ready', () => {
		const store: RootStore = useStore.getState();
		store.setChatsBeStatus(false);
		setup(<SecondaryBarView expanded />);
		expect(screen.getByTestId('shimmering_list_view')).toBeInTheDocument();
	});

	test('Collapsed sidebar view', () => {
		setup(<SecondaryBarView expanded={false} />);
		const funnelButton = screen.getByTestId(iconFunnelOutline);
		expect(funnelButton).toBeInTheDocument();
	});

	describe('ConversationList inside SecondaryBarView tests', () => {
		test('List is rendered in order of last message in chat', async () => {
			setup(<SecondaryBarView expanded />);
			const listNotFiltered = await screen.findByTestId('conversations_list_filtered');
			expect(listNotFiltered.children[0].textContent?.includes(user2Be.name)).toBeTruthy();
			expect(listNotFiltered.children[1].textContent?.includes(user3Be.name)).toBeTruthy();
			expect(listNotFiltered.children[2].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
			expect(listNotFiltered.children[3].textContent?.includes(mockedGroup2.name!)).toBeTruthy();
		});

		test('User filter conversations and expect only groups to be visible', async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			// user search a group conversation
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'Group of');

			const list = await screen.findByTestId('conversations_list_filtered');
			expect(list.children).toHaveLength(2);
			const closeButton = screen.getByTestId(iconCloseOutline);
			expect(closeButton).toBeInTheDocument();
			// user click the close button
			await user.click(closeButton);
			expect(textArea).toHaveValue('');
			const funnelButton = screen.getByTestId(iconFunnelOutline);
			expect(funnelButton).toBeInTheDocument();
		});

		test('List filtered in order of last message in chat and expect only groups', async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'Group of');
			const list = await screen.findByTestId('conversations_list_filtered');
			expect(list.children[0].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
			expect(list.children[1].textContent?.includes(mockedGroup2.name!)).toBeTruthy();
		});

		test('User filter conversations and expect both groups and oneToOne to be visible', async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			// user search a one to one conversation
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'User');
			const list2 = await screen.findByTestId('conversations_list_filtered');
			expect(list2.children).toHaveLength(4);
			const closeButton = screen.getByTestId(iconCloseOutline);
			expect(closeButton).toBeInTheDocument();
			await user.click(closeButton);
			expect(textArea).toHaveValue('');
			const funnelButton = screen.getByTestId(iconFunnelOutline);
			expect(funnelButton).toBeInTheDocument();
		});

		test('User filter conversations by an name and expect to see oneToOne and all the groups where the string match', async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			// user search a one to one conversation
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'User3');
			const list2 = await screen.findByTestId('conversations_list_filtered');
			expect(list2.children).toHaveLength(2);
			const closeButton = screen.getByTestId(iconCloseOutline);
			expect(closeButton).toBeInTheDocument();
			await user.click(closeButton);
			expect(textArea).toHaveValue('');
			const funnelButton = screen.getByTestId(iconFunnelOutline);
			expect(funnelButton).toBeInTheDocument();
		});

		test('List filtered in order of last message in chat and expect and groups where the string match', async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'User3');
			const list = await screen.findByTestId('conversations_list_filtered');
			expect(list.children[0].textContent?.includes(user3Be.name)).toBeTruthy();
			expect(list.children[1].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
		});

		test("The filter doesn't find any match", async () => {
			const { user } = setup(<SecondaryBarView expanded />);
			const textArea = screen.getByRole('textbox');
			await user.type(textArea, 'Hello');
			const noMatchText = screen.getByText(
				/There are no users matching this search in your existing chats./i
			);
			expect(noMatchText).toBeInTheDocument();
		});
	});

	// TODO fix test
	// describe('FilteredGal inside SecondaryBarView tests', () => {
	// 	test('User filter gal and expect only one user to be visible', async () => {
	// 		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);
	// 		const { user } = setup(<SecondaryBarView expanded />);
	// 		// user search a user
	// 		const textArea = screen.getByRole('textbox', {
	// 			name: /type to filter list/i
	// 		});
	// 		await user.type(textArea, '1');
	//
	// 		await waitFor(() => {
	// 			const galListItems = screen.getAllByTestId('gal_list_item');
	// 			expect(galListItems).toHaveLength(1);
	// 		});
	// 	});
	//
	// 	test('User filter gal but AutoCompleteGalRequest fails', async () => {
	// 		mockSearchUsersByFeatureRequest.mockRejectedValueOnce(new Error('Error'));
	// 		const { user } = setup(<SecondaryBarView expanded />);
	// 		// user search a user
	// 		const textArea = screen.getByRole('textbox');
	// 		await user.type(textArea, '1');
	// 		const noMatchText = await screen.findByText(
	// 			/There seems to be a problem with your search, please retry./i
	// 		);
	// 		expect(noMatchText).toBeInTheDocument();
	// 	});
	//
	// 	test('User try to search again using Retry button after a failed search', async () => {
	// 		mockSearchUsersByFeatureRequest.mockRejectedValueOnce(new Error('Error'));
	// 		const { user } = setup(<SecondaryBarView expanded />);
	// 		// user search a user
	// 		const textArea = screen.getByRole('textbox');
	// 		await user.type(textArea, '1');
	// 		const noMatchText = await screen.findByText(
	// 			/There seems to be a problem with your search, please retry./i
	// 		);
	// 		expect(noMatchText).toBeInTheDocument();
	//
	// 		const retryButton = screen.getByText('Retry');
	// 		expect(retryButton).toBeInTheDocument();
	//
	// 		mockSearchUsersByFeatureRequest.mockRejectedValueOnce(new Error('Error'));
	// 		await user.click(retryButton);
	//
	// 		expect(mockSearchUsersByFeatureRequest).toHaveBeenCalledTimes(2);
	// 	});
	// });
});
