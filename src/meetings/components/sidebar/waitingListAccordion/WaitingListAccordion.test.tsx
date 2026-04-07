/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

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
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	meetingType: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1.id, name: 'user1' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
});
describe('WaitingListAccordion tests', () => {
	test('Accordion is visible if the user is a moderator and there are waiting users', () => {
		const store = useStore.getState();
		store.addUserToWaitingList(meeting.id, user2.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.getByText(/Waiting list/i)).toBeInTheDocument();
	});

	test("Accordion isn't visible if there aren't waiting users", () => {
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.queryByText(/Waiting list/i)).not.toBeInTheDocument();
	});

	test('Toggle accordion status', async () => {
		const iconUp = 'icon: ChevronUp';
		const iconDown = 'icon: ChevronDown';

		const store = useStore.getState();
		store.addUserToWaitingList(meeting.id, user2.id);
		const { user } = setup(<WaitingListAccordion meetingId={meeting.id} />);
		expect(screen.getByTestId(iconUp)).toBeVisible();

		await user.click(screen.getByTestId(iconUp));
		expect(screen.getByTestId(iconDown)).toBeVisible();

		await user.click(screen.getByTestId(iconDown));
		expect(screen.getByTestId(iconUp)).toBeVisible();
	});

	test('Badge counter is visible if the accordion is closed', () => {
		const store = useStore.getState();
		store.addUserToWaitingList(meeting.id, user2.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		act(() => store.setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, false));
		expect(screen.getByText('1')).toBeVisible();
	});

	test("Badge counter isn't visible if the accordion is open", () => {
		const store = useStore.getState();
		store.addUserToWaitingList(meeting.id, user2.id);
		setup(<WaitingListAccordion meetingId={meeting.id} />);
		act(() => store.setMeetingSidebarStatus(MeetingAccordionType.WAITING_LIST, true));
		expect(screen.queryByText('1')).not.toBeInTheDocument();
	});
});
