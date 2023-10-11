/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import GroupAvatar from './GroupAvatar';
import useStore from '../../store/Store';
import { createMockMeeting, createMockParticipants, createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';

const hiEveryone = 'hi everyone!';
const iconVideo = 'icon: Video';

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
const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});
const user2Participant: MeetingParticipant = createMockParticipants({
	userId: 'user2',
	sessionId: 'sessionIdUser2'
});

const roomId = 'Group-Room-Id';
const meeting: MeetingBe = createMockMeeting({
	roomId,
	participants: [user1Participant, user2Participant]
});
const room: RoomBe = createMockRoom({ members, id: roomId });
const roomMuted: RoomBe = createMockRoom({
	members,
	id: roomId,
	userSettings: { muted: true }
});
const roomWithMeeting = createMockRoom({
	members,
	id: roomId,
	meetingId: 'meetingId'
});
const roomMutedWithMeeting = createMockRoom({
	members,
	id: roomId,
	userSettings: { muted: true },
	meetingId: 'meetingId'
});

describe('Group avatar', () => {
	test('Check if group notifications are disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		store.setRoomPictureUpdated(roomMuted.id, '2022-08-25T17:24:28.961+02:00');
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('Check if group notifications are enabled', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId(`${room.name}-avatar`);
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('Check if there is the draft message and notifications enabled', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setDraftMessage(roomId, false, hiEveryone);
		setup(<GroupAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
	test('Check if there is the draft message and notifications disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		store.setDraftMessage(roomId, false, hiEveryone);
		setup(<GroupAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
	test('Check if there is an ongoing meeting', async () => {
		const store = useStore.getState();
		store.addRoom(roomWithMeeting);
		store.addMeeting(meeting);
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});
	test('Check if there is an ongoing meeting in a muted room', async () => {
		const store = useStore.getState();
		store.addRoom(roomMutedWithMeeting);
		store.addMeeting(meeting);
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});
	test('Check if there is an ongoing meeting in a room with a draft message', async () => {
		const store = useStore.getState();
		store.addRoom(roomWithMeeting);
		store.addMeeting(meeting);
		store.setDraftMessage(roomId, false, hiEveryone);
		setup(<GroupAvatar roomId={roomId} draftMessage />);
		const userAvatarWithMeeting = screen.getByTestId(iconVideo);
		expect(userAvatarWithMeeting).toBeVisible();
	});
});
