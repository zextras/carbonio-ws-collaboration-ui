/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingSidebar from './MeetingSidebar';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });

const oneToOneRoom: RoomBe = createMockRoom({
	id: '1to1-room-test',
	type: RoomType.ONE_TO_ONE,
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: user1.id, owner: true })
	],
	userSettings: { muted: false }
});

const groupRoom: RoomBe = createMockRoom({
	id: 'group-room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: false })
	],
	userSettings: { muted: false }
});

const temporaryRoomMod: RoomBe = createMockRoom({
	id: 'temporary-mod-room-test',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: false })
	]
});

const temporaryRoom: RoomBe = createMockRoom({
	id: 'temporary-room-test',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: sessionUser.id, owner: false }),
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: false })
	]
});

const oneToOneMeeting: MeetingBe = createMockMeeting({
	id: '1to1-meeting-test',
	roomId: oneToOneRoom.id,
	participants: [createMockParticipants({ userId: sessionUser.id })]
});

const groupMeeting: MeetingBe = createMockMeeting({
	id: 'group-meeting-test',
	roomId: groupRoom.id,
	participants: [createMockParticipants({ userId: sessionUser.id })]
});

const scheduledMeetingMod: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test',
	roomId: temporaryRoomMod.id,
	participants: [createMockParticipants({ userId: sessionUser.id })]
});

const scheduledMeeting: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-test',
	roomId: temporaryRoom.id,
	participants: [createMockParticipants({ userId: sessionUser.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.setCapabilities(createMockCapabilityList({ canVideoCallRecord: true }));
	store.setRooms([oneToOneRoom, groupRoom, temporaryRoom, temporaryRoomMod]);
	store.setMeetings([oneToOneMeeting, groupMeeting, scheduledMeeting, scheduledMeetingMod]);
	store.meetingConnection(oneToOneMeeting.id, false, 'audioId', false, 'videoId');
	store.setWaitingList(scheduledMeetingMod.id, [user1.id]);
});
describe('Meeting sidebar', () => {
	test('OneToOne meeting has Action, Recording and Chat accordions ', async () => {
		useParams.mockReturnValue({ meetingId: oneToOneMeeting.id });
		setup(<MeetingSidebar />);
		const actionsAccordions = screen.getByText(/Actions/);
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.queryByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).toBeInTheDocument();
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).not.toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Group meeting has Action, Recording, Participant and Chat accordions ', async () => {
		useParams.mockReturnValue({ meetingId: groupMeeting.id });
		setup(<MeetingSidebar />);
		const actionsAccordions = screen.getByText(/Actions/);
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).toBeInTheDocument();
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Scheduled meeting moderator has Recording, WaitingList, Participant and Chat accordions ', async () => {
		useParams.mockReturnValue({ meetingId: scheduledMeetingMod.id });
		setup(<MeetingSidebar />);
		const actionsAccordions = screen.queryByText(/Actions/);
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting list/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).not.toBeInTheDocument();
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Scheduled meeting member has Participant and Chat accordions ', () => {
		useParams.mockReturnValue({ meetingId: scheduledMeeting.id });
		setup(<MeetingSidebar />);
		const actionsAccordions = screen.queryByText(/Actions/);
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).not.toBeInTheDocument();
		expect(recordingAccordion).not.toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Recording accordion is not visible with recording capability set to false', async () => {
		useParams.mockReturnValue({ meetingId: oneToOneMeeting.id });
		useStore.getState().setCapabilities(createMockCapabilityList({ canVideoCallRecord: false }));
		const { user } = setup(<MeetingSidebar />);
		const recordingAccordion = screen.queryByText(/Recording/);
		expect(recordingAccordion).not.toBeInTheDocument();
	});

	test('toggle Sidebar', async () => {
		useParams.mockReturnValue({ meetingId: oneToOneMeeting.id });
		const { user } = setup(<MeetingSidebar />);
		const button = screen.getByTestId('icon: ChevronLeftOutline');
		expect(button).toBeInTheDocument();
		await user.click(button);
		const sidebarClosed = await screen.findByTestId('icon: ChevronRightOutline');
		expect(sidebarClosed).toBeInTheDocument();
	});

	test('when user click the sidebar button, the sidebar closes', async () => {
		useParams.mockReturnValue({ meetingId: oneToOneMeeting.id });
		const { user } = setup(<MeetingSidebar />);

		const sidebarButton = screen.getByTestId('sidebar_button');
		await user.click(sidebarButton);

		const closedSidebarButton = await screen.findByTestId('icon: ChevronRightOutline');
		expect(closedSidebarButton).toBeVisible();
	});
});
