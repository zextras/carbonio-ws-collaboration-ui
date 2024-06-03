/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingRecordingStoppedEventHandler } from './MeetingRecordingStoppedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingRecordingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingRecordingStoppedEvent = {
	type: WsEventType.MEETING_RECORDING_STOPPED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('MeetingRecordingStoppedEventHandler tests', () => {
	test('Meeting starting information are reset into store', () => {
		meetingRecordingStoppedEventHandler(event);
		const state = useStore.getState();
		expect(state.meetings[room.id].recStartedAt).toBeUndefined();
		expect(state.meetings[room.id].recUserId).toBeUndefined();
	});

	test('A custom event is sent if the session user is inside meeting', () => {
		useStore.getState().meetingConnection(meeting.id, false, undefined, false, undefined);
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingRecordingStoppedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_RECORDING_STOPPED, { detail: event })
		);
	});

	test('A custom event is not sent if the session user is not inside meeting', () => {
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingRecordingStoppedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
