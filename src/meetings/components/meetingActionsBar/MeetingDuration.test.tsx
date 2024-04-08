/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import MeetingDuration from './MeetingDuration';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const room: RoomBe = createMockRoom();

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.addRoom(room);
	store.addMeeting(meeting);
	store.startMeeting(meeting.id, '2024-08-25T17:24:28.961+02:00');
});
describe('MeetingDuration tests', () => {
	test('Meeting duration is displayed correctly', async () => {
		setup(<MeetingDuration meetingId={meeting.id} />);
		const icon = screen.getByTestId('icon: ClockOutline');
		expect(icon).toBeInTheDocument();
	});

	test('Meeting duration is not displayed when meetingId is not provided', async () => {
		setup(<MeetingDuration meetingId={undefined} />);
		const meetingDuration = screen.queryByTestId('meeting_duration_component');
		expect(meetingDuration).not.toBeInTheDocument();
	});

	test('Meeting duration is not displayed when meetingStartedAt is not provided', async () => {
		setup(<MeetingDuration meetingId="meeting" />);
		const meetingDuration = screen.queryByTestId('meeting_duration_component');
		expect(meetingDuration).not.toBeInTheDocument();
	});
});
