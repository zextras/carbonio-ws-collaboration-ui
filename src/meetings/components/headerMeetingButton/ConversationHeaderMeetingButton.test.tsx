/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import ConversationHeaderMeetingButton from './ConversationHeaderMeetingButton';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { mockedAddRoomRequest } from '../../../tests/mocks/network';
import { mockGoToRoomPage } from '../../../tests/mocks/useRouting';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const storeSetupOneToOne = (): void => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.ONE_TO_ONE,
		members: [user1, user2]
	});
	store.addRoom(room);
	setup(<ConversationHeaderMeetingButton roomId={room.id} />);
};
const storeSetupOneToOneMeeting = (): { store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.ONE_TO_ONE,
		members: [user1, user2]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	const user1Participant: MeetingParticipant = createMockParticipants({
		userId: user1.id,
		sessionId: 'sessionIdUser1'
	});
	const user2Participant: MeetingParticipant = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2'
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant]
	});
	store.addMeeting(meeting);
	setup(<ConversationHeaderMeetingButton roomId={room.id} />);
	return { store };
};
const storeSetupGroup = (): void => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const room: RoomBe = createMockRoom({
		type: RoomType.GROUP,
		members: [user1, user2]
	});
	store.addRoom(room);
	setup(<ConversationHeaderMeetingButton roomId={room.id} />);
};
const storeSetupGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [user1, user2]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	mockedAddRoomRequest.mockReturnValue({
		id: 'room-id',
		name: ' ',
		description: '',
		membersIds: [user2.id]
	});
	mockGoToRoomPage.mockReturnValue(`room of ${user2.name}`);
	const user1Participant: MeetingParticipant = createMockParticipants({
		userId: user1.id,
		sessionId: 'sessionIdUser1'
	});
	const user2Participant: MeetingParticipant = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2'
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant]
	});
	store.addMeeting(meeting);
	const { user } = setup(<ConversationHeaderMeetingButton roomId={room.id} />);
	return { user, store };
};
const storeSetupGroupMeetingWithoutMe = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const user3: UserBe = createMockUser({
		id: 'user3Id',
		name: 'user 3',
		pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
	});
	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [user1, user2, user3]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	const user3Participant: MeetingParticipant = createMockParticipants({
		userId: user3.id,
		sessionId: 'sessionIdUser3'
	});
	const user2Participant: MeetingParticipant = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2'
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user3Participant, user2Participant]
	});
	store.addMeeting(meeting);
	const { user } = setup(<ConversationHeaderMeetingButton roomId={room.id} />);
	return { user, store };
};

describe('Conversation header meeting button - one to one', () => {
	test('everything is rendered correctly', () => {
		storeSetupOneToOne();
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();
	});
	test('everything is rendered correctly - meeting started', () => {
		storeSetupOneToOneMeeting();
		const disabledButton = screen.getByTestId('join_meeting_button');
		expect(disabledButton).toBeEnabled();
	});
});

describe('Conversation header meeting button - group', () => {
	test('everything is rendered correctly', () => {
		storeSetupGroup();
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();
	});
	test('everything is rendered correctly - meeting started', () => {
		storeSetupGroupMeeting();
		const disabledButton = screen.getByTestId('join_meeting_button');
		expect(disabledButton).toBeEnabled();
		const videoButton = screen.getByTestId('video_button');
		expect(videoButton).toBeVisible();
		const participantListButton = screen.getByTestId('participant_list_button');
		expect(participantListButton).toBeVisible();
	});
	test("toggle dropdown - I'm inside the meeting", async () => {
		const { user } = storeSetupGroupMeeting();

		const participantListButton = screen.getByTestId('participant_list_button');
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		const participantDropdown = await screen.findByTestId('participant_dropdown');
		expect(participantDropdown).toBeVisible();

		const list = await screen.findByTestId('participant_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(2);
	});
	test("toggle dropdown - I'm not inside the meeting", async () => {
		const { user } = storeSetupGroupMeetingWithoutMe();

		const participantListButton = screen.getByTestId('participant_list_button');
		expect(participantListButton).not.toBeDisabled();
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		const participantDropdown = await screen.findByTestId('participant_dropdown');
		expect(participantDropdown).toBeVisible();

		const list = await screen.findByTestId('participant_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(2);

		const goToPrivateChatButton = await screen.findAllByTestId('go_to_private_chat');
		expect(goToPrivateChatButton).toHaveLength(2);
	});
	test('go to private chat from dropdown', async () => {
		const { user } = storeSetupGroupMeeting();

		const participantListButton = screen.getByTestId('participant_list_button');
		await user.click(participantListButton);

		// there's two participants inside the meeting, so the one who's not me will have the 'go to private chat' button
		const goToPrivateChatButton = await screen.findAllByTestId('go_to_private_chat');
		expect(goToPrivateChatButton).toHaveLength(1);
		await user.click(goToPrivateChatButton[0]);
		expect(mockGoToRoomPage).toBeCalled();
	});
	test('open meeting', async () => {
		const meetingOpen = jest.spyOn(window, 'open');
		const { user } = storeSetupGroupMeetingWithoutMe();
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();

		await user.click(joinMeetingButton);
		expect(meetingOpen).toHaveBeenCalledTimes(1);
	});
	test("hide dropdown when there's no one else inside the meeting", async () => {
		const { user } = storeSetupGroupMeetingWithoutMe();
		const participantListButton = screen.getByTestId('participant_list_button');
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		expect(screen.getByTestId('participant_dropdown')).toBeVisible();

		act(() => {
			useStore.getState().removeParticipant('meetingId', 'user2Id');
			useStore.getState().removeParticipant('meetingId', 'user3Id');
		});
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
	});
});
