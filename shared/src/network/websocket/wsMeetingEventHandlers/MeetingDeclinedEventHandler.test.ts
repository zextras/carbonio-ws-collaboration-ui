/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingDeclinedEventHandler } from './MeetingDeclinedEventHandler';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { mockSendCustomEvent } from '../../../tests/setupTests';
import useStore from '../../../tests/testStore';
import { EventName } from '../../../types/AppEvents';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingDeclinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({ type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingDeclinedEvent = {
	type: WsEventType.MEETING_DECLINED,
	sentDate: '2026-04-23T09:33:35.555Z',
	meetingId: meeting.id,
	userId: 'callee-user-id'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});

describe('MeetingDeclinedEventHandler tests', () => {
	test('Custom event is dispatched when the user is in the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingDeclinedEventHandler(event);
		expect(mockSendCustomEvent).toHaveBeenCalledWith({
			name: EventName.MEETING_DECLINED,
			data: event
		});
	});

	test('Custom event is NOT dispatched when the user is not in the active meeting', () => {
		meetingDeclinedEventHandler(event);
		expect(mockSendCustomEvent).not.toHaveBeenCalled();
	});

	test('REMOVED_MEETING_NOTIFICATION is dispatched when I declined a ONE_TO_ONE meeting from another session', () => {
		meetingDeclinedEventHandler({ ...event, userId: 'myUserId' });
		const call = mockSendCustomEvent.mock.calls[0][0];
		expect(call.name).toBe(EventName.REMOVED_MEETING_NOTIFICATION);
	});
});
