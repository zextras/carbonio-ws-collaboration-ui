/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingJoinedEventHandler } from './MeetingJoinedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/setupTests';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({ id: 'oneToOneRoomId', type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({ id: 'oneToOneMeeting', roomId: room.id });

const room2 = createMockRoom({ id: 'groupWith10Participants', type: RoomType.GROUP });
const meetingWith10Participants = createMockMeeting({
	id: 'meetingWith10Participants',
	roomId: room2.id,
	participants: [
		createMockParticipants({ userId: 'user1' }),
		createMockParticipants({ userId: 'user2' }),
		createMockParticipants({ userId: 'user3' }),
		createMockParticipants({ userId: 'user4' }),
		createMockParticipants({ userId: 'user5' }),
		createMockParticipants({ userId: 'user6' }),
		createMockParticipants({ userId: 'user7' }),
		createMockParticipants({ userId: 'user8' }),
		createMockParticipants({ userId: 'user9' }),
		createMockParticipants({ userId: 'user10' }),
		createMockParticipants({ userId: 'user11' })
	]
});

const groupRoom = createMockRoom({ id: 'groupRoomId', type: RoomType.GROUP });
const groupMeeting = createMockMeeting({ id: 'groupMeetingId', roomId: groupRoom.id });

const event: MeetingJoinedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_JOINED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId'
};

const event2: MeetingJoinedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_JOINED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meetingWith10Participants.id,
	userId: 'sessionUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'sessionUserId' });
	store.addRooms([room, room2, groupRoom]);
	store.addMeetings([meeting, groupMeeting, meetingWith10Participants]);
});
describe('meetingJoinedEventHandler tests', () => {
	test('Joined participant information are added into store', () => {
		meetingJoinedEventHandler(event);
		const meet = useStore.getState().meetings[meeting.id];
		expect(meet.participants[event.userId]).toBeDefined();
	});

	test('A custom event is sent if the joined user is the session user and the room is a one-to-one', () => {
		event.userId = 'sessionUserId';
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.REMOVED_MEETING_NOTIFICATION, { detail: event })
		);
	});

	test('A custom event is not sent if the joined user is different from the session user', () => {
		event.userId = 'anotherUserId';
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if it is from a group meeting', () => {
		event.meetingId = groupMeeting.id;
		event.userId = 'sessionUserId';
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Audio feedback is sent when session user is inside meeting', () => {
		event.userId = 'anotherUserId';
		event.meetingId = meeting.id;
		useStore.getState().meetingConnection(meeting.id);
		meetingJoinedEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('Audio feedback is not sent when participants are more than 10', () => {
		event2.userId = 'anotherUserId';
		event2.meetingId = meetingWith10Participants.id;
		useStore.getState().meetingConnection(meetingWith10Participants.id);
		meetingJoinedEventHandler(event2);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Audio feedback is not sent outside active meeting', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id);
		store.meetingDisconnection(meeting.id);
		meetingJoinedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});
});
