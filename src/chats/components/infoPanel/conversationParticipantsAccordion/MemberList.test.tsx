/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act } from '@testing-library/react';

import MemberList from './MemberList';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { Member, RoomType } from '../../../../types/store/RoomTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Be: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const user2Be: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
});

const user3Be: User = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3'
});

const user4Be: User = createMockUser({
	id: 'user4',
	email: 'user4@domain.com',
	name: 'User 4'
});

const user4MemberBe: Member = createMockMember({ userId: 'user4' });

const room: RoomBe = createMockRoom({
	id: 'Room-Id',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id }),
		createMockMember({ userId: user3Be.id })
	]
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
	store.setUserInfo([user1Be, user2Be, user3Be, user4Be]);
});

describe('Participants list', () => {
	test('The participants list should be rendered as expected', async () => {
		setup(<MemberList roomId={room.id} />);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);
		expect(screen.getByText(user1Be.name)).toBeInTheDocument();
		expect(screen.getByText(user2Be.name)).toBeInTheDocument();
		expect(screen.getByText(user3Be.name)).toBeInTheDocument();
	});

	test('Adding new user inside list should not break the list', async () => {
		setup(<MemberList roomId={room.id} />);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);

		act(() => useStore.getState().addRoomMember(room.id, user4MemberBe));
		expect(list.children).toHaveLength(4);
	});

	test('remove user inside list should not break the list', async () => {
		setup(<MemberList roomId={room.id} />);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);

		act(() => useStore.getState().removeRoomMember(room.id, user1Be.id));
		expect(list.children).toHaveLength(2);
	});

	test('Search one member inside list', async () => {
		const { user } = setup(<MemberList roomId={room.id} />);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const list = await screen.findByTestId('members_list');
		await user.type(searchInput, user1Be.name);
		expect(list.children).toHaveLength(1);
	});

	test('Search more members inside list', async () => {
		const { user } = setup(<MemberList roomId={room.id} />);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const list = await screen.findByTestId('members_list');
		await user.type(searchInput, 'user');
		expect(list.children).toHaveLength(3);
	});

	test('Search a user that is not in the list', async () => {
		const { user } = setup(<MemberList roomId={room.id} />);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const searchIcon = screen.getByTestId('icon: Search');
		expect(searchIcon).toBeInTheDocument();
		const list = await screen.findByTestId('members_list');
		await user.type(searchInput, user4Be.id);

		const placeholderText = await screen.findByText(
			/Your search returned no results, try another keyword./i
		);
		expect(placeholderText).toBeInTheDocument();
		expect(list).not.toBeInTheDocument();

		const closeButton = await screen.findByTestId('close_button');
		await user.click(closeButton);
		expect(placeholderText).not.toBeInTheDocument();
	});
});
