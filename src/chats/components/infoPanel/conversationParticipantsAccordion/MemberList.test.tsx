/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act } from '@testing-library/react';

import MemberList from './MemberList';
import useStore from '../../../../store/Store';
import { mockedGetUserPictureRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { Member, RoomType } from '../../../../types/store/RoomTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Be: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};
const user2Be: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};
const user3Be: User = {
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 3"
};

const user4Be: User = {
	id: 'user4',
	email: 'user4@domain.com',
	name: 'User 4',
	lastSeen: 1642818617000,
	statusMessage: "Hey there! I'm User 4"
};

const user4MemberBe: Member = {
	userId: 'user4',
	owner: false,
	temporary: false,
	external: false
};

const room: RoomBe = {
	id: 'Room-Id',
	name: 'Room Name',
	description: 'This is the description of the group',
	type: RoomType.GROUP,
	createdAt: '1234567',
	updatedAt: '12345678',
	pictureUpdatedAt: '123456789',
	members: [
		{
			userId: 'user1',
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: 'user2',
			owner: false,
			temporary: false,
			external: false
		},
		{
			userId: 'user3',
			owner: false,
			temporary: false,
			external: false
		}
	]
};

const ImageBlob = {
	size: 1234,
	type: 'image/jpeg'
};

describe('Participants list', () => {
	test('The participants list should be rendered as expected', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		setup(<MemberList roomId={room.id} />);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);
		expect(screen.getByText(/User 1/i)).toBeInTheDocument();
		expect(screen.getByText(/User 2/i)).toBeInTheDocument();
		expect(screen.getByText(/User 3/i)).toBeInTheDocument();
	});
	test('Adding new user inside list should not break the list', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setUserInfo(user4Be);
		setup(<MemberList roomId={room.id} />);
		// mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);

		act(() => store.addRoomMember(room.id, user4MemberBe));
		expect(list.children).toHaveLength(4);
	});
	test('remove user inside list should not break the list', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setUserInfo(user4Be);
		setup(<MemberList roomId={room.id} />);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const list = await screen.findByTestId('members_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);

		act(() => store.removeRoomMember(room.id, 'user3'));
		expect(list.children).toHaveLength(2);
	});
	test('Search one member inside list', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		const { user } = setup(<MemberList roomId={room.id} />);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const list = await screen.findByTestId('members_list');
		await user.type(searchInput, user1Be.name);
		expect(list.children).toHaveLength(1);
	});
	test('Search more members inside list', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		const { user } = setup(<MemberList roomId={room.id} />);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const list = await screen.findByTestId('members_list');
		await user.type(searchInput, 'user');
		expect(list.children).toHaveLength(3);
	});
	test('Search a user that is not in the list', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		const { user } = setup(<MemberList roomId={room.id} />);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		const searchInput = screen.getByRole('textbox', { name: /Search members/i });
		const searchIcon = screen.getByTestId('icon: Search');
		expect(searchIcon).toBeInTheDocument();
		const list = await screen.findByTestId('members_list');
		user.type(searchInput, 'user 4');

		const placeholderText = await screen.findByText(/There are no items that match this search/i);
		expect(placeholderText).toBeInTheDocument();
		expect(list).not.toBeInTheDocument();

		const closeButton = await screen.findByTestId('close_button');
		user.click(closeButton);
		const placeholderText1 = await screen.findByText(/There are no items that match this search/i);
		expect(placeholderText1).not.toBeInTheDocument();
	});
});
