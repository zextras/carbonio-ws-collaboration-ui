/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import MeetingSidebar from './MeetingSidebar';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const oneToOneRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.ONE_TO_ONE,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant]
});

const oneToOneMeeting: MeetingBe = createMockMeeting({
	roomId: oneToOneRoom.id,
	participants: [user1Participant]
});

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<MeetingSidebar />);
	return { user, store: result.current };
};
const setupBasicOneToOne = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(oneToOneRoom);
		result.current.addMeeting(oneToOneMeeting);
		result.current.meetingConnection(oneToOneMeeting.id, false, 'audioId', false, 'videoId');
	});
	useParams.mockReturnValue({ meetingId: oneToOneMeeting.id });
	const { user } = setup(<MeetingSidebar />);
	return { user, store: result.current };
};

describe('Meeting sidebar', () => {
	test('OneToOne meeting has Action and Chat accordions ', async () => {
		setupBasicOneToOne();
		const actionsAccordions = screen.getByText(/Actions/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.queryByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).not.toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('Group meeting has Action, Participant and Chat accordions ', async () => {
		setupBasicGroup();
		const actionsAccordions = screen.getByText(/Actions/);
		const waitingListAccordion = screen.queryByText(/Waiting List/);
		const participantsAccordion = screen.getByTestId('MeetingParticipantsAccordion');
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).toBeInTheDocument();
		expect(waitingListAccordion).not.toBeInTheDocument();
		expect(participantsAccordion).toBeInTheDocument();
		expect(chatAccordion).toBeInTheDocument();
	});

	test('one to one meeting - participant accordion must not be present', () => {
		setupBasicOneToOne();
		const MeetingParticipantsAccordion = screen.queryByTestId('MeetingParticipantsAccordion');
		const actionsAccordions = screen.getByText(/Actions/);
		const chatAccordion = screen.getByText(/Chat/);
		expect(actionsAccordions).toBeVisible();
		expect(chatAccordion).toBeVisible();
		expect(MeetingParticipantsAccordion).not.toBeInTheDocument();
	});

	test('toggle Sidebar', async () => {
		const { user } = setupBasicOneToOne();
		const button = screen.getByTestId('icon: ChevronLeftOutline');
		expect(button).toBeInTheDocument();
		await user.click(button);
		const sidebarClosed = await screen.findByTestId('icon: ChevronRightOutline');
		expect(sidebarClosed).toBeInTheDocument();
	});

	test('when user click the sidebar button, the sidebar closes', async () => {
		const { user } = setupBasicOneToOne();

		const sidebarButton = screen.getByTestId('sidebar_button');
		await user.click(sidebarButton);

		const closedSidebarButton = await screen.findByTestId('icon: ChevronRightOutline');
		expect(closedSidebarButton).toBeVisible();
	});
});
