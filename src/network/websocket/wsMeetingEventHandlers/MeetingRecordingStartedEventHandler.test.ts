/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingRecordingStartedEventHandler } from './MeetingRecordingStartedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingRecordingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, meetingType: MeetingType.SCHEDULED });

const event: MeetingRecordingStartedEvent = {
	type: WsEventType.MEETING_RECORDING_STARTED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});
describe('MeetingRecordingStartedEventHandler tests', () => {
	test('Meeting starting information are saved into store', () => {
		meetingRecordingStartedEventHandler(event);
		const state = useStore.getState();
		expect(state.meetings[meeting.id].recStartedAt).toBe(event.sentDate);
		expect(state.meetings[meeting.id].recUserId).toBe(event.userId);
	});

	test('A custom event is sent if the user is inside meeting', () => {
		useStore.getState().meetingConnection(meeting.id);
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingRecordingStartedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_RECORDING_STARTED, { detail: event })
		);
	});

	test('A custom event is not sent if the user is not inside meeting', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingRecordingStartedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
