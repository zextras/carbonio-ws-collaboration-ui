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
import { mockSearchUsersByFeatureRequest } from '../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../types/network/soap/searchUsersByFeatureRequest';

const createNewRoom = 'Create new Room';
const virtualRoomName = 'New Virtual Room';
const createNewVirtualRoom = 'Create new Virtual Room';
const newVirtualRoomsName = 'New Virtual Room’s name*';

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

// Mock objects
const contactUser1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User One',
	id: 'user1-id'
};

const contactUser2: ContactInfo = {
	email: 'user2@test.com',
	displayName: 'User Two',
	id: 'user2-id'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setCapabilities(createMockCapabilityList());
});

describe('VirtualRoomsButton', () => {
	test("user copy virtual room's link", async () => {
		const store = useStore.getState();
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
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([]);
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(textArea, virtualRoomName);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalled();
	});

	test('Try to create a room without a name', async () => {
		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(textArea, 'a{backspace}');

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});

	test('Try to create a room without a name too long', async () => {
		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(
			textArea,
			'Lorem dolo ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeDisabled();
	});

	test('create virtual room with 2 moderators', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValue([contactUser1, contactUser2]);

		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(textArea, virtualRoomName);

		const chipContactOne = await screen.findByText('User One');
		const chipContactTwo = await screen.findByText('User Two');

		await user.click(chipContactOne);
		await user.click(chipContactTwo);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [
				{ userId: contactUser1.id, owner: true },
				{ userId: contactUser2.id, owner: true }
			]
		});
	});

	test('create virtual room by selecting and removing one moderator', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValue([contactUser1, contactUser2]);

		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(textArea, virtualRoomName);

		const chipContactOne = await screen.findByText('User One');
		const chipContactTwo = await screen.findByText('User Two');

		await user.click(chipContactOne);
		await user.click(chipContactTwo);

		// removing chip
		await user.click(chipContactOne);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [{ userId: contactUser2.id, owner: true }]
		});
	});

	test('create virtual room by typing one moderator name', async () => {
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);
		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);
		await user.type(textArea, virtualRoomName);

		mockSearchUsersByFeatureRequest.mockReturnValueOnce([contactUser1]);
		const moderatorInput = await screen.findByText("Room's moderators");
		await user.type(moderatorInput, 'User One');

		const chipContactOne = await screen.findByText('User One');
		await user.click(chipContactOne);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalledWith({
			name: virtualRoomName,
			type: RoomType.TEMPORARY,
			members: [{ userId: contactUser1.id, owner: true }]
		});
	});
});
