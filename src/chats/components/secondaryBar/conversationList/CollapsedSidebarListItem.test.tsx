/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import CollapsedSidebarListItem from './CollapsedSidebarListItem';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const backgroundColor = 'background-color: #cfd5dc';

const user2Be: User = createMockUser({
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2'
});

const user1Be: User = createMockUser();

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

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1Be.id, user1Be.name);
	store.setUserInfo([user1Be, user2Be]);
	store.addRooms([mockedOneToOne, mockedGroup]);
});

describe('Collapsed sidebar list item', () => {
	test('Group - There is a new message', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedGroup.id, 1);
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeInTheDocument();
		expect(unreadBadge).toHaveStyle('background-color: #2b73d2');
	});

	test('Group - There is a new message and notifications are muted', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedGroup.id, 1);
		store.setRoomMuteStatus(mockedGroup.id, true);
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});

	test('Group - There is a new message and also a draft', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedGroup.id, 1);
		store.setRoomMuteStatus(mockedGroup.id, true);
		store.setDraftMessage(mockedGroup.id, 'hi everyone!');
		setup(<CollapsedSidebarListItem roomId={mockedGroup.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		expect(screen.queryByTestId('icon: Edit2')).not.toBeInTheDocument();
	});

	test('One to one - There is a new message', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedOneToOne.id, 1);
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeInTheDocument();
		expect(unreadBadge).toHaveStyle('background-color: #2b73d2');
	});

	test('One to one - There is a new message and notifications are muted', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedOneToOne.id, 1);
		store.setRoomMuteStatus(mockedOneToOne.id, true);
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});

	test('One to one - There is a new message and also a draft', async () => {
		const store: RootStore = useStore.getState();
		store.incrementUnreadCount(mockedOneToOne.id, 1);
		store.setRoomMuteStatus(mockedOneToOne.id, true);
		store.setDraftMessage(mockedOneToOne.id, 'hi everyone!');
		setup(<CollapsedSidebarListItem roomId={mockedOneToOne.id} />);
		const unreadBadge = screen.getByTestId('unreads_counter');
		expect(unreadBadge).toBeVisible();
		expect(unreadBadge).toHaveStyle(backgroundColor);
		expect(screen.queryByTestId('icon: Edit2')).not.toBeInTheDocument();
	});
});
