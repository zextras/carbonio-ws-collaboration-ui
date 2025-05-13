/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import GroupAvatar from './GroupAvatar';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../types/network/models/roomBeTypes';

const hiEveryone = 'hi everyone!';
const iconVideo = 'icon: Video';

const members = [
	createMockMember({ userId: 'user1', owner: true }),
	createMockMember({ userId: 'user2' })
];

const meetingParticipants = [
	createMockParticipants({ userId: members[0].userId }),
	createMockParticipants({ userId: members[1].userId })
];

const room: RoomBe = createMockRoom({ members, id: 'roomId' });

const roomMuted: RoomBe = createMockRoom({
	members,
	id: 'roomMutedId',
	userSettings: { muted: true }
});

const roomWithMeeting = createMockRoom({
	members,
	id: 'roomWithMeetingId',
	meetingId: 'meetingId'
});

const roomMutedWithMeeting = createMockRoom({
	members,
	id: 'roomMutedWithMeetingId',
	userSettings: { muted: true },
	meetingId: 'meetingId'
});

const meeting: MeetingBe = createMockMeeting({
	id: 'meetingId',
	roomId: roomWithMeeting.id,
	participants: meetingParticipants
});

const meetingMuted: MeetingBe = createMockMeeting({
	id: 'meetingMutedId',
	roomId: roomMutedWithMeeting.id,
	participants: meetingParticipants
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room, roomMuted, roomWithMeeting, roomMutedWithMeeting]);
	store.addMeetings([meeting, meetingMuted]);
});

describe('Group avatar', () => {
	test('Check if group notifications are disabled', async () => {
		const store = useStore.getState();
		store.editRoom(roomMuted.id, { pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00' });
		setup(<GroupAvatar roomId={roomMuted.id} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});

	test('Check if group notifications are enabled', async () => {
		setup(<GroupAvatar roomId={room.id} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId(`${room.name}-avatar`);
		expect(avatarWithNotificationMuted).toBeVisible();
	});

	test('Check if there is the draft message and notifications enabled', async () => {
		const store = useStore.getState();
		store.setDraftMessage(room.id, hiEveryone);
		setup(<GroupAvatar roomId={room.id} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});

	test('Check if there is the draft message and notifications disabled', async () => {
		const store = useStore.getState();
		store.setDraftMessage(roomMuted.id, hiEveryone);
		setup(<GroupAvatar roomId={roomMuted.id} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});

	test('Check if there is an ongoing meeting', async () => {
		setup(<GroupAvatar roomId={roomWithMeeting.id} draftMessage={false} />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});

	test('Check if there is an ongoing meeting in a muted room', async () => {
		setup(<GroupAvatar roomId={roomMutedWithMeeting.id} draftMessage={false} />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});

	test('Check if there is an ongoing meeting in a room with a draft message', async () => {
		const store = useStore.getState();
		store.setDraftMessage(roomWithMeeting.id, hiEveryone);
		setup(<GroupAvatar roomId={roomWithMeeting.id} draftMessage />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});
});
