/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

import MeetingNotificationsHandler from './MeetingNotificationsHandler';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import {
	MeetingCreatedEvent,
	MeetingJoinedEvent
} from '../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../types/store/RoomTypes';

const room = createMockRoom({ id: 'roomId', type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({ id: 'meetingId', roomId: room.id });

const room1 = createMockRoom({ id: 'roomId1', type: RoomType.ONE_TO_ONE });
const meeting1 = createMockMeeting({ id: 'meetingId1', roomId: room1.id });
const addIncomingMeetingNotification = (room: RoomBe, meeting: MeetingBe): void => {
	const event: MeetingCreatedEvent = {
		id: `notificationId${meeting.id}`,
		from: 'userId',
		sentDate: '2412412421',
		sessionId: 'sessionId',
		meetingId: meeting.id,
		type: WsEventType.MEETING_CREATED,
		roomId: room.id
	};
	const store = useStore.getState();
	act(() => {
		store.addRoom(room);
		store.addMeeting(meeting);
		sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
	});
};

describe('MeetingNotificationsHandler', () => {
	test('Nothing is rendered when there are no notifications', () => {
		setup(<MeetingNotificationsHandler />);
		const notifications = screen.queryByTestId('incoming_call_notification_portal');
		expect(notifications).not.toBeInTheDocument();
	});

	test('An notification is rendered when a MeetingCreatedEvent is received', () => {
		setup(<MeetingNotificationsHandler />);
		addIncomingMeetingNotification(room, meeting);
		expect(screen.getByTestId('incoming_call_notification_portal')).toBeInTheDocument();
	});

	test('A notification is removed when a JoinMeetingEvent is received', () => {
		setup(<MeetingNotificationsHandler />);
		addIncomingMeetingNotification(room, meeting);
		expect(screen.getByTestId('incoming_call_notification_portal')).toBeInTheDocument();

		const joinEvent: MeetingJoinedEvent = {
			id: `notificationId${meeting.id}2`,
			from: 'userId',
			sentDate: '2412412421',
			sessionId: 'sessionId',
			meetingId: meeting.id,
			type: WsEventType.MEETING_JOINED
		};
		act(() => sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: joinEvent }));
		expect(screen.queryByTestId('incoming_call_notification_portal')).not.toBeInTheDocument();
	});

	test('A notification is removed when meeting is removed', () => {
		setup(<MeetingNotificationsHandler />);
		addIncomingMeetingNotification(room, meeting);
		expect(screen.getByTestId('incoming_call_notification')).toBeInTheDocument();

		act(() => useStore.getState().deleteMeeting(meeting.id));
		expect(screen.queryByTestId('incoming_call_notification')).not.toBeInTheDocument();
	});

	test("Button 'Decline all' is rendered when there are more than one notification", () => {
		setup(<MeetingNotificationsHandler />);
		addIncomingMeetingNotification(room, meeting);
		addIncomingMeetingNotification(room1, meeting1);
		expect(screen.getByText('Decline all')).toBeInTheDocument();
	});

	test('All notifications are removed when button Decline all is clicked', async () => {
		const { user } = setup(<MeetingNotificationsHandler />);
		addIncomingMeetingNotification(room, meeting);
		addIncomingMeetingNotification(room1, meeting1);
		expect(screen.getByText('Decline all')).toBeInTheDocument();
		expect(screen.getAllByTestId('incoming_call_notification')).toHaveLength(2);

		await user.click(screen.getByText('Decline all'));
		expect(screen.queryByTestId('incoming_call_notification')).not.toBeInTheDocument();
		expect(screen.queryByTestId('incoming_call_notification_portal')).not.toBeInTheDocument();
	});
});
