/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingStartedEventHandler } from './MeetingStartedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const oneToOneRoom = createMockRoom({ id: 'oneToOneRoomId', type: RoomType.ONE_TO_ONE });
const oneToOneMeeting = createMockMeeting({ id: 'oneToOneMeetingId', roomId: oneToOneRoom.id });

const groupRoom = createMockRoom({ id: 'groupRoomId', type: RoomType.GROUP });
const groupMeeting = createMockMeeting({ id: 'groupMeetingId', roomId: groupRoom.id });

const event: MeetingStartedEvent = {
	type: WsEventType.MEETING_STARTED,
	sentDate: '2023-01-01T00:00:00.000Z',
	meetingId: oneToOneMeeting.id,
	starterUser: 'starterId',
	startedAt: '2023-01-01T00:00:00.000Z'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'myusername');
	store.addRoom(oneToOneRoom);
	store.addMeeting(oneToOneMeeting);
	store.addRoom(groupRoom);
	store.addMeeting(groupMeeting);
});
describe('MeetingStartedEventHandler tests', () => {
	test('Meeting starting information are saved into store', () => {
		meetingStartedEventHandler(event);
		const store = useStore.getState();
		expect(store.meetings[oneToOneMeeting.roomId].active).toBeTruthy();
		expect(store.meetings[oneToOneMeeting.roomId].startedAt).toBe(event.startedAt);
	});

	test('Incoming meeting notification is sent if the meeting is from one-to-one room and started by the other user', () => {
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingStartedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.INCOMING_MEETING, { detail: event })
		);
	});

	test('Incoming meeting notification is not sent if the meeting is started by me', () => {
		useStore.getState().setLoginInfo(event.starterUser, 'myusername');
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingStartedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Incoming meeting notification is not sent if the room is not one-to-one', () => {
		event.meetingId = groupMeeting.id;
		meetingStartedEventHandler(event);
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
