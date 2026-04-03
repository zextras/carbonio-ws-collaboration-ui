/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import UserAvatar from './UserAvatar';
import useStore from '../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { User } from '../../types/store/UserTypes';

const hiString = 'hi everyone!';
const bgGrayDot = 'background-color: #cfd5dc';
const bgGreenDot = 'background-color: #8bc34a';
const iconBellOff = 'icon: BellOff';

const user1Info: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const user2Info: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
});

const user3Info: User = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3'
});

const user1Participant: MeetingParticipant = createMockParticipants({ userId: 'user1' });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: 'user2' });

const members = [
	createMockMember({ userId: user1Info.id, owner: true }),
	createMockMember({ userId: user2Info.id })
];

const room: RoomBe = createMockRoom({ id: 'roomId', members, type: RoomType.ONE_TO_ONE });
const roomMuted: RoomBe = createMockRoom({
	id: 'mutedRoomId',
	type: RoomType.ONE_TO_ONE,
	members,
	userSettings: { muted: true }
});
const roomWithPicture: RoomBe = createMockRoom({
	id: 'roomWithPicture',
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user3Info.id })
	]
});
const singleConversationWithUnloadUser: RoomBe = createMockRoom({
	id: 'unloadRoomId',
	type: RoomType.ONE_TO_ONE,
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: 'unloadUserId' })
	]
});

const roomWithMeeting: RoomBe = createMockRoom({
	id: 'meetingRoomId',
	type: RoomType.ONE_TO_ONE,
	members,
	meetingId: 'meetingId'
});

const roomMutedWithMeeting: RoomBe = createMockRoom({
	id: 'mutedWithMeetingRoomId',
	type: RoomType.ONE_TO_ONE,
	members,
	userSettings: { muted: true },
	meetingId: 'meetingId2'
});

const meeting: MeetingBe = createMockMeeting({
	id: 'meetingId',
	roomId: roomWithMeeting.id,
	participants: [user1Participant, user2Participant]
});

const meeting2: MeetingBe = createMockMeeting({
	id: 'meetingId2',
	roomId: roomMutedWithMeeting.id,
	participants: [user1Participant, user2Participant]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1Info.id, name: user1Info.name });
	store.setUserInfo([user1Info, user2Info, user3Info]);
	store.addRooms([
		room,
		roomWithPicture,
		singleConversationWithUnloadUser,
		roomMuted,
		roomMutedWithMeeting
	]);
	store.addMeetings([meeting, meeting2]);
});

describe('User avatar', () => {
	describe('Presence dot', () => {
		test('User presence dot should be visible when carbonioWscShowUsersPresence attribute is set to true', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
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
		test('User presence dot should not be visible when carbonioWscShowUsersPresence attribute is set to false', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'FALSE' }));
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
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const avatar = screen.getByTestId('avatar_box');
			expect(avatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGrayDot);
		});
		test('User presence dot should be green and shows he is online', async () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			store.setUserPresence('user2', true);
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const avatar = screen.getByTestId('avatar_box');
			expect(avatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGreenDot);
		});
	});

	describe('Notifications enabled/disabled', () => {
		test('Check if the conversation has notifications disabled and user is online', () => {
			const store = useStore.getState();
			store.setUserPresence('user2', true);
			store.setRoomMuteStatus(room.id, true);
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const iconOff = screen.getByTestId(iconBellOff);
			expect(iconOff).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGreenDot);
		});
		test('Check if the conversation has notifications disabled and user is offline', () => {
			const store = useStore.getState();
			store.setRoomMuteStatus(room.id, true);
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const iconOff = screen.getByTestId(iconBellOff);
			expect(iconOff).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGrayDot);
		});
		test('Check if the conversation has notifications enabled and user is online', () => {
			const store = useStore.getState();
			store.setUserPresence('user2', true);
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const userAvatar = screen.getByTestId('User 2-avatar');
			expect(userAvatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGreenDot);
		});
		test('Check if the conversation has notifications enabled and user is offline', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			setup(<UserAvatar roomId={room.id} draftMessage={false} />);
			const userAvatar = screen.getByTestId('User 2-avatar');
			expect(userAvatar).toBeVisible();
			const presenceDot = screen.getByTestId('user_presence_dot');
			expect(presenceDot).toBeVisible();
			expect(presenceDot).toHaveStyle(bgGrayDot);
		});
		test('Check if user has notifications disabled', () => {
			setup(<UserAvatar roomId={roomMuted.id} draftMessage={false} />);
			const userAvatarWithNotificationMuted = screen.getByTestId(iconBellOff);
			expect(userAvatarWithNotificationMuted).toBeVisible();
		});
		test('Check if user has notifications disabled in a chat with an ongoing meeting', () => {
			setup(<UserAvatar roomId={roomMutedWithMeeting.id} draftMessage={false} />);
			const userAvatarWithNotificationMuted = screen.getByTestId('icon: Video');
			expect(userAvatarWithNotificationMuted).toBeVisible();
		});
	});

	describe('Draft message', () => {
		test('Check if there is the draft message and notifications enabled', () => {
			const store = useStore.getState();
			store.setDraftMessage(room.id, hiString);
			setup(<UserAvatar roomId={room.id} draftMessage />);
			const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
			expect(userAvatarWithDraft).toBeVisible();
		});
		test('Check if there is the draft message and notifications disabled', () => {
			const store = useStore.getState();
			store.setDraftMessage(room.id, hiString);
			setup(<UserAvatar roomId={room.id} draftMessage />);
			const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
			expect(userAvatarWithDraft).toBeVisible();
		});
		test('Check if there is the draft message and there is an ongoing meeting', () => {
			const store = useStore.getState();
			store.setDraftMessage(room.id, hiString);
			setup(<UserAvatar roomId={roomWithMeeting.id} draftMessage />);
			const userAvatarWithDraft = screen.getByTestId('icon: Video');
			expect(userAvatarWithDraft).toBeVisible();
		});
	});
});
