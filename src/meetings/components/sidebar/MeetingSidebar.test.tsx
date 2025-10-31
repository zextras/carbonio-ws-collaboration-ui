/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import MeetingSidebar from './MeetingSidebar';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { VirtualBackgroundType } from '../../../types/store/ActiveMeetingTypes';

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
	store.setAttributes(createMockAttributesList({ carbonioWscRecordingEnabled: 'TRUE' }));
	store.addRooms([oneToOneRoom, groupRoom, temporaryRoom, temporaryRoomMod]);
	store.addMeetings([oneToOneMeeting, groupMeeting, scheduledMeeting, scheduledMeetingMod]);
	store.meetingConnection(oneToOneMeeting.id);
	store.setWaitingList(scheduledMeetingMod.id, [user1.id]);
});

describe('Meeting sidebar', () => {
	test('OneToOne meeting has Recording and Chat accordions ', async () => {
		routerContextSetup(<MeetingSidebar />, { meetingId: oneToOneMeeting.id });
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.queryByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).not.toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Group meeting has Recording, Participant and Chat accordions ', async () => {
		routerContextSetup(<MeetingSidebar />, { meetingId: groupMeeting.id });
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Scheduled meeting moderator has Recording, WaitingList, Participant and Chat accordions ', async () => {
		routerContextSetup(<MeetingSidebar />, { meetingId: scheduledMeetingMod.id });
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting list/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(recordingAccordion).toBeInTheDocument();
		expect(waitingListAccordion).toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Scheduled meeting member has Participant and Chat accordions ', () => {
		routerContextSetup(<MeetingSidebar />, { meetingId: scheduledMeeting.id });
		const recordingAccordion = screen.queryByText(/Recording/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(recordingAccordion).not.toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Recording accordion is not visible with recording capability set to false', async () => {
		useStore
			.getState()
			.setAttributes(createMockAttributesList({ carbonioWscRecordingEnabled: 'FALSE' }));
		routerContextSetup(<MeetingSidebar />, { meetingId: oneToOneMeeting.id });
		const recordingAccordion = screen.queryByText(/Recording/);
		expect(recordingAccordion).not.toBeInTheDocument();
	});

	test('toggle Sidebar', async () => {
		const { user } = routerContextSetup(<MeetingSidebar />, { meetingId: oneToOneMeeting.id });
		const button = screen.getByTestId('icon: ChevronLeftOutline');
		expect(button).toBeInTheDocument();
		await user.click(button);
		const sidebarClosed = await screen.findByTestId('icon: ChevronRightOutline');
		expect(sidebarClosed).toBeInTheDocument();
	});

	test('when user click the sidebar button, the sidebar closes', async () => {
		const { user } = routerContextSetup(<MeetingSidebar />, { meetingId: oneToOneMeeting.id });

		const sidebarButton = screen.getByTestId('sidebar_button');
		await user.click(sidebarButton);

		const closedSidebarButton = await screen.findByTestId('icon: ChevronRightOutline');
		expect(closedSidebarButton).toBeVisible();
	});

	test('when user select a virtual background, the one selected has green border', async () => {
		useStore.getState().setAttributes(createMockAttributesList());
		const { user } = routerContextSetup(<MeetingSidebar />, { meetingId: oneToOneMeeting.id });

		const t = screen.getAllByTestId('icon: ChevronDown');
		await user.click(t[1]);

		expect(screen.getByTestId(VirtualBackgroundType.NONE)).toBeVisible();

		act(() => {
			useStore.getState().setBackgroundImage(VirtualBackgroundType.LIVING_ROOM);
		});

		const styles = getComputedStyle(screen.getByTestId(VirtualBackgroundType.LIVING_ROOM));

		expect(styles.outline).toBe('2px solid #639030');

		act(() => {
			useStore.getState().setBackgroundImage(VirtualBackgroundType.BLUR);
		});

		expect(screen.getByTestId(VirtualBackgroundType.LIVING_ROOM)).not.toHaveStyle(
			'border: 2px solid #669431;'
		);
	});
});
