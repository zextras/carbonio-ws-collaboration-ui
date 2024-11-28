/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import VirtualRoomsButton from './VirtualRoomsButton';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });

// session user is the only moderator
const roomSessionOnlyModerator: RoomBe = createMockRoom({
	id: 'temporary-mod-room-test',
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: sessionUser.id, owner: true })]
});

const meetingSessionOnlyModerator: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test',
	roomId: roomSessionOnlyModerator.id
});

// session user and another user are moderators
const roomSessionTwoMod = createMockRoom({
	id: 'temporary-mod-room-test-1',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: user1.id, owner: true })
	]
});

const meetingSessionTwoMod: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test-1',
	roomId: roomSessionTwoMod.id
});

// session user is moderator and the meeting is active
const roomSessionTwoModActive = createMockRoom({
	id: 'temporary-mod-room-test-2',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: user2.id, owner: true })
	]
});

const meetingSessionTwoModActive: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test-2',
	roomId: roomSessionTwoModActive.id,
	participants: [
		createMockParticipants({ userId: sessionUser.id }),
		createMockParticipants({ userId: user2.id })
	]
});

// session user is member but not a moderator in a meeting that is active
const roomTwoModActive = createMockRoom({
	id: 'temporary-mod-room-test-3',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: sessionUser.id, owner: false }),
		createMockMember({ userId: user2.id, owner: true }),
		createMockMember({ userId: user1.id, owner: true })
	]
});

const meetingTwoModActive: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test-3',
	roomId: roomTwoModActive.id,
	participants: [createMockParticipants({ userId: user2.id })]
});

describe('VirtualRoomsButton', () => {
	test("user copy virtual room's link", async () => {
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setUserInfo(user1);
		store.setUserInfo(user2);
		store.setCapabilities(createMockCapabilityList());
		store.setRooms([
			roomSessionOnlyModerator,
			roomSessionTwoMod,
			roomSessionTwoModActive,
			roomTwoModActive
		]);
		store.setMeetings([
			meetingSessionOnlyModerator,
			meetingSessionTwoModActive,
			meetingTwoModActive,
			meetingSessionTwoMod
		]);

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const copyButton = await screen.findAllByTestId('icon: Link2Outline');
		expect(copyButton[0]).toBeVisible();

		await user.click(copyButton[0]);

		const copiedLink = await window.navigator.clipboard.readText();
		expect(copiedLink).toEqual(
			'https://localhost/carbonio/focus-mode/meetings/scheduled-meeting-mod-test'
		);
	});

	test('create virtual room', async () => {
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setUserInfo(user1);
		store.setUserInfo(user2);
		store.setCapabilities(createMockCapabilityList());

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: 'Create new Room' });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText('Create new Virtual Room');
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByRole('textbox');

		await user.type(textArea, 'New Virtual Room');

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalled();
	});
});
