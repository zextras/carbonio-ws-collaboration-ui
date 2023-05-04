/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import UserAvatar from './UserAvatar';
import useStore from '../store/Store';
import { createMockCapabilityList, createMockMember, createMockRoom } from '../tests/createMock';
import { RoomBe, RoomType } from '../types/network/models/roomBeTypes';
import { User } from '../types/store/UserTypes';

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

const user3Info: User = {
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
};

const members = [
	createMockMember({ userId: user1Info.id, owner: true }),
	createMockMember({ userId: user2Info.id })
];

const room: RoomBe = createMockRoom({ members, type: RoomType.ONE_TO_ONE });
const roomMuted: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members,
	userSettings: { muted: true }
});
const roomWithPicture: RoomBe = createMockRoom({
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user3Info.id })
	]
});

describe('User avatar', () => {
	test('user avatar has not data loaded and show shimmer element', () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<UserAvatar roomId={room.id} draftMessage={false} />);
		const shimmerAvatar = screen.getByTestId('shimmer_avatar');
		expect(shimmerAvatar).toBeVisible();
	});

	describe('Presence dot', () => {
		test('User presence dot should be visible when canSeeUsersPresence capability is set to true', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);

			// User2 is online
			act(() => store.setUserPresence('user2', true));
			const presenceDot = screen.queryByTestId('user_presence_dot');
			expect(presenceDot).toBeInTheDocument();

			// User2 is offline
			act(() => store.setUserPresence('user2', false));
			const presenceDotOffline = screen.queryByTestId('user_presence_dot');
			expect(presenceDotOffline).toBeInTheDocument();
		});
		test('User presence dot should not be visible when canSeeUsersPresence capability is set to false', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: false }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);

			// User2 is online
			act(() => store.setUserPresence('user2', true));
			const presenceDot = screen.queryByTestId('user_presence_dot');
			expect(presenceDot).not.toBeInTheDocument();

			// User2 is offline
			act(() => store.setUserPresence('user2', false));
			const presenceDotOffline = screen.queryByTestId('user_presence_dot');
			expect(presenceDotOffline).not.toBeInTheDocument();
		});
		test('User presence dot should be gray and shows he is offline', async () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setUserPictureUpdated(user2Info.id, '2022-08-25T17:24:28.961+02:00');
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
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
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const avatar = screen.getByTestId('avatar_box');
			expect(avatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle('background-color: #8bc34a');
		});
	});

	describe('Notifications enabled/disabled', () => {
		test('Check if the conversation has notifications disabled and user is online', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setUserPresence('user2', true);
			store.setRoomMuted(room.id);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const iconOff = screen.getByTestId('icon: BellOff');
			expect(iconOff).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle('background-color: #8bc34a');
		});
		test('Check if the conversation has notifications disabled and user is offline', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setRoomMuted(room.id);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const iconOff = screen.getByTestId('icon: BellOff');
			expect(iconOff).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle('background-color: #cfd5dc');
		});
		test('Check if the conversation has notifications enabled and user is online', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setUserPresence('user2', true);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const userAvatar = screen.getByTestId('User 2-avatar');
			expect(userAvatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle('background-color: #8bc34a');
		});
		test('Check if the conversation has notifications enabled and user is offline', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const userAvatar = screen.getByTestId('User 2-avatar');
			expect(userAvatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle('background-color: #cfd5dc');
		});
		test('Check if user has notifications disabled', () => {
			const store = useStore.getState();
			store.addRoom(roomMuted);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			setup(<UserAvatar roomId={roomMuted.id} draftMessage={false} />);
			const userAvatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
			expect(userAvatarWithNotificationMuted).toBeVisible();
		});
	});

	describe('Draft message', () => {
		test('Check if there is the draft message and notifications enabled', () => {
			const store = useStore.getState();
			store.addRoom(room);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setDraftMessage(room.id, false, 'hi everyone!');
			setup(<UserAvatar roomId={room.id} draftMessage />);
			const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
			expect(userAvatarWithDraft).toBeVisible();
		});
		test('Check if there is the draft message and notifications disabled', () => {
			const store = useStore.getState();
			store.addRoom(roomMuted);
			store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			store.setUserInfo(user2Info);
			store.setDraftMessage(room.id, false, 'hi everyone!');
			setup(<UserAvatar roomId={room.id} draftMessage />);
			const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
			expect(userAvatarWithDraft).toBeVisible();
		});
	});

	test('Show user picture if user has one', () => {
		const store = useStore.getState();
		store.addRoom(roomWithPicture);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user3Info);
		setup(<UserAvatar roomId={room.id} draftMessage={false} />);
		const avatar = screen.getByTestId(`${user3Info.name}-avatar`);
		expect(avatar.children.length).toBe(0);
	});
});