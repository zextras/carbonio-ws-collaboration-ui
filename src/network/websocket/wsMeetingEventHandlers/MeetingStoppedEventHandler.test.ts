/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingStoppedEventHandler } from './MeetingStoppedEventHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const oneToOneRoom = createMockRoom({ id: 'oneToOneRoomId', type: RoomType.ONE_TO_ONE });
const oneToOneMeeting = createMockMeeting({ id: 'oneToOneMeetingId', roomId: oneToOneRoom.id });
const oneToOneEvent: MeetingStoppedEvent = {
	type: WsEventType.MEETING_STOPPED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: oneToOneMeeting.id
};

const groupRoom = createMockRoom({ id: 'groupRoomId', type: RoomType.GROUP });
const groupMeeting = createMockMeeting({ id: 'groupMeetingId', roomId: groupRoom.id });
const groupEvent: MeetingStoppedEvent = {
	type: WsEventType.MEETING_STOPPED,
	sentDate: '2023-01-01T00:00:00.000Z',
	meetingId: groupMeeting.id
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'myusername');
	store.addRoom(oneToOneRoom);
	store.addMeeting(oneToOneMeeting);
	store.addRoom(groupRoom);
	store.addMeeting(groupMeeting);
});
describe('MeetingStoppedEventHandler tests', () => {
	test('Meeting stopped information are saved into store', () => {
		meetingStoppedEventHandler(oneToOneEvent);
		const store = useStore.getState();
		expect(store.meetings[oneToOneMeeting.roomId].active).toBeFalsy();
		expect(store.meetings[oneToOneMeeting.roomId].startedAt).toBeUndefined();
	});

	test('Removed meeting notification is sent if the meeting is from one-to-one room', () => {
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingStoppedEventHandler(oneToOneEvent);
		expect(dispatchEvent).toHaveBeenCalled();
	});

	test('Removed meeting notification is not sent if the room is not one-to-one', () => {
		meetingStoppedEventHandler(groupEvent);
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Meeting stopped notification is sent if the meeting is active', () => {
		useStore.getState().meetingConnection(groupMeeting.id, false, undefined, false, undefined);
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingStoppedEventHandler(groupEvent);
		expect(dispatchEvent).toHaveBeenCalled();
	});
});
