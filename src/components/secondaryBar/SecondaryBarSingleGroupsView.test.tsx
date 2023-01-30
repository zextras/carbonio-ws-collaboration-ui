/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../store/Store';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { User } from '../../types/store/UserTypes';
import SecondaryBarSingleGroupsView from './SecondaryBarSingleGroupsView';

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

describe('Secondary Bar', () => {
	test('everything is rendered correctly', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedGroup1);
		store.addRoom(mockedOneToOne1);
		store.addRoom(mockedGroup2);
		store.addRoom(mockedOneToOne2);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		setup(<SecondaryBarSingleGroupsView expanded />);
		const listNotFiltered = await screen.findByTestId('conversations_list_filtered');
		expect(listNotFiltered.children).toHaveLength(4);
	});
	test('the filter shows only what the user types', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedGroup1);
		store.addRoom(mockedOneToOne1);
		store.addRoom(mockedGroup2);
		store.addRoom(mockedOneToOne2);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		const { user } = setup(<SecondaryBarSingleGroupsView expanded />);

		// user search a group conversation
		const textArea = screen.getByRole('textbox');
		await user.type(textArea, 'Group of');
		const list = await screen.findByTestId('conversations_list_filtered');
		expect(list.children).toHaveLength(2);
		const closeButton = screen.getByTestId('icon: CloseOutline');
		expect(closeButton).toBeInTheDocument();

		// user click the close button
		await user.click(closeButton);
		expect(textArea).toHaveValue('');
		const funnelButton = screen.getByTestId('icon: FunnelOutline');
		expect(funnelButton).toBeInTheDocument();

		// user search a one to one conversation
		await user.type(textArea, 'User');
		const list2 = await screen.findByTestId('conversations_list_filtered');
		expect(list2.children).toHaveLength(2);
	});
	test("the filter doesn't find any match", async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedGroup1);
		store.addRoom(mockedOneToOne1);
		store.addRoom(mockedGroup2);
		store.addRoom(mockedOneToOne2);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		const { user } = setup(<SecondaryBarSingleGroupsView expanded />);

		const textArea = screen.getByRole('textbox');
		await user.type(textArea, 'Hello');
		const list = await screen.findByTestId('conversations_list_filtered');
		expect(list.children).toHaveLength(1);
		const noMatchText = screen.getByText(/There are no items that match this search/i);
		expect(noMatchText).toBeInTheDocument();
	});
	test('Collapsed sidebar view', () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedGroup1);
		store.addRoom(mockedOneToOne1);
		store.addRoom(mockedGroup2);
		store.addRoom(mockedOneToOne2);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		setup(<SecondaryBarSingleGroupsView expanded={false} />);
		const funnelButton = screen.getByTestId('icon: FunnelOutline');
		expect(funnelButton).toBeInTheDocument();
	});
});