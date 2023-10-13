/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

const backgroundColor = 'background-color: #cfd5dc';

const user2Be: User = {
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const user1Be: User = {
	id: 'user1Id',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const mockedGroup: RoomBe = createMockRoom({
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id }),
		createMockMember({ userId: 'user3Id', owner: true })
	]
});

const mockedOneToOne: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user2Be.id })]
});

describe('Collapsed sidebar list item', () => {
	test('Group - There is a new message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.incrementUnreadCount(mockedGroup.id);
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeInTheDocument();
		expect(unreadBadge).toHaveStyle('background-color: #2b73d2');
	});
	test('Group - There is a new message and notifications are muted', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.incrementUnreadCount(mockedGroup.id);
		store.setRoomMuted(mockedGroup.id);
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('Group - There is a new message and also a draft', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.incrementUnreadCount(mockedGroup.id);
		store.setRoomMuted(mockedGroup.id);
		store.setDraftMessage(mockedGroup.id, false, 'hi everyone!');
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithWithDraft = screen.getByTestId('icon: Edit2');
		expect(avatarWithWithDraft).toBeVisible();
	});
	test('One to one - There is a new message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.incrementUnreadCount(mockedOneToOne.id);
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeInTheDocument();
		expect(unreadBadge).toHaveStyle('background-color: #2b73d2');
	});
	test('One to one - There is a new message and notifications are muted', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.incrementUnreadCount(mockedOneToOne.id);
		store.setRoomMuted(mockedOneToOne.id);
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('One to one - There is a new message and also a draft', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.incrementUnreadCount(mockedOneToOne.id);
		store.setRoomMuted(mockedOneToOne.id);
		store.setDraftMessage(mockedOneToOne.id, false, 'hi everyone!');
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithWithDraft = screen.getByTestId('icon: Edit2');
		expect(avatarWithWithDraft).toBeVisible();
	});
});
