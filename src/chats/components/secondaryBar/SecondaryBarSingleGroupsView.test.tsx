/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import SecondaryBarSingleGroupsView from './SecondaryBarSingleGroupsView';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

const iconCloseOutline = 'icon: CloseOutline';
const iconFunnelOutline = 'icon: FunnelOutline';
const helloString = 'Hello guys!';

const user1Be: User = {
	id: 'user1Id',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1",
	pictureUpdatedAt: '235968427123'
};

const user2Be: User = {
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const user3Be: User = {
	id: 'user3Id',
	email: 'user3@domain.com',
	name: 'User3',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 3"
};

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

const secondaryBarSetup = (status: boolean): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
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
	const { user } = setup(<SecondaryBarSingleGroupsView expanded={status} />);
	return { user, store };
};

describe('Secondary Bar', () => {
	test('everything is rendered correctly', async () => {
		secondaryBarSetup(true);
		const listNotFiltered = await screen.findByTestId('conversations_list_filtered');
		expect(listNotFiltered.children).toHaveLength(4);
	});
	test('List is rendered in order of last message in chat', async () => {
		secondaryBarSetup(true);
		const listNotFiltered = await screen.findByTestId('conversations_list_filtered');
		expect(listNotFiltered.children[0].textContent?.includes(user2Be.name)).toBeTruthy();
		expect(listNotFiltered.children[1].textContent?.includes(user3Be.name)).toBeTruthy();
		expect(listNotFiltered.children[2].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
		expect(listNotFiltered.children[3].textContent?.includes(mockedGroup2.name!)).toBeTruthy();
	});
	test('User filter conversations and expect only groups to be visible', async () => {
		const { user } = secondaryBarSetup(true);
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
		const { user } = secondaryBarSetup(true);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, 'Group of');
		const list = await screen.findByTestId('conversations_list_filtered');
		expect(list.children[0].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
		expect(list.children[1].textContent?.includes(mockedGroup2.name!)).toBeTruthy();
	});
	test('User filter conversations and expect both groups and oneToOne to be visible', async () => {
		const { user } = secondaryBarSetup(true);
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
		const { user } = secondaryBarSetup(true);
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
		const { user } = secondaryBarSetup(true);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, 'User3');
		const list = await screen.findByTestId('conversations_list_filtered');
		expect(list.children[0].textContent?.includes(user3Be.name)).toBeTruthy();
		expect(list.children[1].textContent?.includes(mockedGroup1.name!)).toBeTruthy();
	});
	test("the filter doesn't find any match", async () => {
		const { user } = secondaryBarSetup(true);
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, 'Hello');
		const list = await screen.findByTestId('conversations_list_filtered');
		expect(list.children).toHaveLength(1);
		const noMatchText = screen.getByText(/There are no items that match this search/i);
		expect(noMatchText).toBeInTheDocument();
	});
	test('Collapsed sidebar view', () => {
		secondaryBarSetup(false);
		const funnelButton = screen.getByTestId(iconFunnelOutline);
		expect(funnelButton).toBeInTheDocument();
	});
});
