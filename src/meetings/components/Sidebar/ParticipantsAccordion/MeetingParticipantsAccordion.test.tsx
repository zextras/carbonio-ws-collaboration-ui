/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/setup/setup';
import React from 'react';

import MeetingParticipantsAccordion from './MeetingParticipantsAccordion';
import MeetingParticipantsList from './MeetingParticipantsList';
import {
	mockedDemotesRoomMemberRequest,
	mockedPromoteRoomMemberRequest
} from '../../../../../jest-mocks';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingParticipantBe } from '../../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

// setup of the store when I'm a moderator
const storeSetupGroupMeetingModerator = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
	const user3: UserBe = createMockUser({
		id: 'user3Id',
		name: 'user 3',
		pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
	});
	const member1: MemberBe = { userId: user1.id, owner: true };
	const member2: MemberBe = { userId: user2.id, owner: false };
	const member3: MemberBe = { userId: user3.id, owner: true };

	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [member1, member2, member3]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	const user1Participant: MeetingParticipantBe = createMockParticipants({
		userId: user1.id,
		sessionId: 'sessionIdUser1'
	});
	const user3Participant: MeetingParticipantBe = createMockParticipants({
		userId: user3.id,
		sessionId: 'sessionIdUser3'
	});
	const user2Participant: MeetingParticipantBe = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2'
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant, user3Participant]
	});
	store.addMeeting(meeting);
	const { user } = setup(<MeetingParticipantsAccordion meetingId={meeting.id} />);
	return { user, store };
};

// setup of the store of a Participant element that is not a moderator, but I'm a moderator
const storeSetupParticipantModerator = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

	const member1: MemberBe = { userId: user1.id, owner: true };
	const member2: MemberBe = { userId: user2.id, owner: false };

	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [member1, member2]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	const user1Participant: MeetingParticipantBe = createMockParticipants({
		userId: user1.id,
		sessionId: 'sessionIdUser1'
	});
	const user2Participant: MeetingParticipantBe = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2',
		audioStreamOn: true
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant]
	});
	store.addMeeting(meeting);
	const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
	return { user, store };
};

// setup of the store of a Participant element that is a moderator, and I'm a moderator
const storeSetupModeratorModerator = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
	const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

	const member1: MemberBe = { userId: user1.id, owner: true };
	const member2: MemberBe = { userId: user2.id, owner: true };

	const room: RoomBe = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [member1, member2]
	});
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	const user1Participant: MeetingParticipantBe = createMockParticipants({
		userId: user1.id,
		sessionId: 'sessionIdUser1'
	});
	const user2Participant: MeetingParticipantBe = createMockParticipants({
		userId: user2.id,
		sessionId: 'sessionIdUser2'
	});
	const meeting: MeetingBe = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant]
	});
	store.addMeeting(meeting);
	const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
	return { user, store };
};

describe("Meeting Participants Accordion - moderator's side", () => {
	test('everything is rendered correctly', async () => {
		const { user } = storeSetupGroupMeetingModerator();
		const chevron = screen.getByTestId('icon: ChevronDown');
		await user.click(chevron);
		const chevronUp = await screen.findByTestId('icon: ChevronUp');
		expect(chevronUp).toBeInTheDocument();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		expect(searchInput).toBeInTheDocument();
		const participantList = screen.getAllByTestId('participant_element');
		expect(participantList).toHaveLength(3);
	});
	test('pin a video', async () => {
		const { user } = storeSetupParticipantModerator();

		const pinVideo = screen.getByTestId('icon: Pin3Outline');
		// pin of user 2's video
		user.click(pinVideo);
		const pinnedVideo = await screen.findByTestId('icon: Unpin3Outline');
		expect(pinnedVideo).toBeInTheDocument();
	});
	test('mute a member', async () => {
		const { user } = storeSetupParticipantModerator();

		const muteAction = screen.getByTestId('icon: MicOffOutline');
		user.click(muteAction);

		const mutedIcon = await screen.findByTestId('icon: MicOff');
		expect(mutedIcon).toBeInTheDocument();
	});
	test('promote moderator', async () => {
		mockedPromoteRoomMemberRequest.mockReturnValueOnce('promoted');

		const { user } = storeSetupParticipantModerator();

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// promote member
		user.click(promoteButton);
		const button = await screen.findByTestId('icon: Crown');
		expect(button).toBeInTheDocument();
	});
	test('demote moderator', async () => {
		mockedDemotesRoomMemberRequest.mockReturnValueOnce('promoted');

		const { user } = storeSetupModeratorModerator();

		const demoteButton = screen.getAllByTestId('icon: Crown');
		expect(demoteButton[1]).toBeInTheDocument();
		expect(demoteButton[1]).toBeEnabled();

		// demote member
		user.click(demoteButton[1]);
		const button = await screen.findByTestId('icon: CrownOutline');
		expect(button).toBeInTheDocument();
	});

	test('Search one member inside list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		await user.type(searchInput, 'user 1');
		expect(list.children).toHaveLength(1);
	});
	test('Search more members inside list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		await user.type(searchInput, 'user');
		expect(list.children).toHaveLength(2);
	});
	test('Search a user that is not in the list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		user.type(searchInput, 'user 4');

		const placeholderText = await screen.findByText(/There are no items that match this search/i);
		expect(placeholderText).toBeInTheDocument();
		expect(list).not.toBeInTheDocument();

		const closeButton = await screen.findByTestId('close_button');
		user.click(closeButton);
		const placeholderText1 = await screen.findByText(/There are no items that match this search/i);
		expect(placeholderText1).not.toBeInTheDocument();
	});
});
