/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingStoppedEventHandler } from './MeetingStoppedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const oneToOneRoom = createMockRoom({
	id: 'oneToOneRoomId',
	type: RoomType.ONE_TO_ONE,
	meetingId: 'oneToOneMeetingId'
});
const oneToOneMeeting = createMockMeeting({ id: oneToOneRoom.meetingId, roomId: oneToOneRoom.id });
const groupRoom = createMockRoom({
	id: 'groupRoomId',
	type: RoomType.GROUP,
	meetingId: 'groupMeetingId'
});
const groupMeeting = createMockMeeting({ id: groupRoom.meetingId, roomId: groupRoom.id });

const oneToOneEvent: MeetingStoppedEvent = {
	type: WsEventType.MEETING_STOPPED,
	sentDate: '2023-01-01T00:00:00.000Z',
	meetingId: oneToOneMeeting.id
};

const groupEvent: MeetingStoppedEvent = {
	type: WsEventType.MEETING_STOPPED,
	sentDate: '2024-01-01T00:00:00.000Z',
	meetingId: groupMeeting.id
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([oneToOneRoom, groupRoom]);
	store.addMeetings([oneToOneMeeting, groupMeeting]);
});

describe('MeetingStoppedEventHandler tests', () => {
	test('Meeting stopped information are saved into store', () => {
		meetingStoppedEventHandler(oneToOneEvent);
		const store = useStore.getState();
		expect(store.meetings[oneToOneMeeting.id].active).toBeFalsy();
		expect(store.meetings[oneToOneMeeting.id].startedAt).toBeUndefined();
	});

	test('Removed meeting notification is sent if the meeting is from one-to-one room', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingStoppedEventHandler(oneToOneEvent);
		const call = dispatchEvent.mock.calls[0][0] as CustomEvent;
		expect(call.type).toBe(EventName.REMOVED_MEETING_NOTIFICATION);
	});

	test('Removed meeting notification is not sent if the room is not one-to-one', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingStoppedEventHandler(groupEvent);
		const call = dispatchEvent.mock.calls[0][0] as CustomEvent;
		expect(call.type).not.toBe(EventName.REMOVED_MEETING_NOTIFICATION);
	});

	test('Meeting stopped notification is sent if the meeting is active', () => {
		useStore.getState().meetingConnection(groupMeeting.id);
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingStoppedEventHandler(groupEvent);
		const call = dispatchEvent.mock.calls[0][0] as CustomEvent;
		expect(call.type).toBe(EventName.MEETING_STOPPED);
	});
});
