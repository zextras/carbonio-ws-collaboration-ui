/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingJoinedEventHandler } from './MeetingJoinedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/mocks/global';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({ id: 'oneToOneRoomId', type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({ id: 'oneToOneMeeting', roomId: room.id });

const groupRoom = createMockRoom({ id: 'groupRoomId', type: RoomType.GROUP });
const groupMeeting = createMockMeeting({ id: 'groupMeetingId', roomId: groupRoom.id });

const event: MeetingJoinedEvent = {
	type: WsEventType.MEETING_JOINED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('sessionUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.addRoom(groupRoom);
	store.addMeeting(groupMeeting);
});
describe('meetingJoinedEventHandler tests', () => {
	test('Joined participant information are added into store', () => {
		meetingJoinedEventHandler(event);
		const meeting = useStore.getState().meetings[room.id];
		expect(meeting.participants[event.userId]).toBeDefined();
	});

	test('A custom event is sent if the joined user is the session user and the room is a one-to-one', () => {
		event.userId = 'sessionUserId';
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.REMOVED_MEETING_NOTIFICATION, { detail: event })
		);
	});

	test('A custom event is not sent if the joined user is different from the session user', () => {
		event.userId = 'anotherUserId';
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if it is from a group meeting', () => {
		event.meetingId = groupMeeting.id;
		event.userId = 'sessionUserId';
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingJoinedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Audio feedback is sent when session user is inside meeting', () => {
		event.userId = 'anotherUserId';
		event.meetingId = meeting.id;
		useStore.getState().meetingConnection(meeting.id, false, undefined, false, undefined);
		meetingJoinedEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('Audio feedback is not sent outside active meeting', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		meetingJoinedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});
});
