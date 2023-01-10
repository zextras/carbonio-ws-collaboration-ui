/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../store/Store';
import { createMockCapabilityList, createMockRoom } from '../tests/createMock';
import { RoomBe, RoomType } from '../types/network/models/roomBeTypes';
import { User } from '../types/store/UserTypes';
import UserAvatar from './UserAvatar';

const user1Info: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
};

const user2Info: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
};

const members = [
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
	}
];

const roomId = 'One-To-One-Room-Id';

const room: RoomBe = createMockRoom({ members, type: RoomType.ONE_TO_ONE, id: roomId });
const roomMuted: RoomBe = createMockRoom({
	members,
	type: RoomType.ONE_TO_ONE,
	id: roomId,
	userSettings: { muted: true }
});

describe('User avatar', () => {
	test('user avatar has not data loaded and show shimmer element', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const shimmerAvatar = screen.getByTestId('shimmer_avatar');
		expect(shimmerAvatar).toBeVisible();
	});
	test('User presence dot should be gray and shows he is offline', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const avatar = screen.getByTestId('avatar_box');
		expect(avatar).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #cfd5dc');
	});
	test('User presence dot should be green and shows he is online', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		store.setUserPresence('user2', true);
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const avatar = screen.getByTestId('avatar_box');
		expect(avatar).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #8bc34a');
	});
	test('Check if the conversation has notifications disabled and user is online', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setUserPresence('user2', true);
		store.setRoomMuted(roomId);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const iconOff = screen.getByTestId('icon: BellOff');
		expect(iconOff).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #8bc34a');
	});
	test('Check if the conversation has notifications disabled and user is offline', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setRoomMuted(roomId);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const iconOff = screen.getByTestId('icon: BellOff');
		expect(iconOff).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #cfd5dc');
	});
	test('Check if the conversation has notifications enabled and user is online', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setUserPresence('user2', true);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const userAvatar = screen.getByTestId('User 2-avatar');
		expect(userAvatar).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #8bc34a');
	});
	test('Check if the conversation has notifications enabled and user is offline', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const userAvatar = screen.getByTestId('User 2-avatar');
		expect(userAvatar).toBeVisible();
		const presenceDot = screen.getByTestId('user_presence_dot');
		expect(presenceDot).toBeVisible();
		expect(presenceDot).toHaveStyle('background-color: #cfd5dc');
	});
	test('Check if user has notifications disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		setup(<UserAvatar roomId={roomId} draftMessage={false} />);
		const userAvatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(userAvatarWithNotificationMuted).toBeVisible();
	});
	test('Check if there is the draft message and notifications enabled', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setDraftMessage(roomId, false, 'hi everyone!');
		setup(<UserAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
	test('Check if there is the draft message and notifications disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		store.setDraftMessage(roomId, false, 'hi everyone!');
		setup(<UserAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
});
