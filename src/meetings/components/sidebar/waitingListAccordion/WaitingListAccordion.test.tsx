/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import WaitingListAccordion from './WaitingListAccordion';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: user1.id })]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	type: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('WaitingListAccordion tests', () => {
	test('Accordion is visible if the user is a moderator and there are waiting users', () => {
		const store = useStore.getState();
		store.promoteMemberToModerator(room.id, user1.id);
		store.addUserToWaitingList(meeting.id, user2.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.getByText(/Waiting list/i)).toBeInTheDocument();
	});

	test("Accordion isn't visible if the user is not a moderator", () => {
		useStore.getState().addUserToWaitingList(meeting.id, user2.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.queryByText(/Waiting list/i)).not.toBeInTheDocument();
	});

	test("Accordion isn't visible if there aren't waiting users", () => {
		useStore.getState().promoteMemberToModerator(room.id, user1.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.queryByText(/Waiting list/i)).not.toBeInTheDocument();
	});
});
