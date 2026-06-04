/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingWaitingParticipantClashedEventHandler } from './MeetingWaitingParticipantClashedEventHandler';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockSendCustomEvent } from '../../../tests/setupTests';
import useStore from '../../../tests/testStore';
import { EventName } from '../../../types/AppEvents';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingWaitingParticipantClashed } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, meetingType: MeetingType.SCHEDULED });

const event: MeetingWaitingParticipantClashed = {
	type: WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.addParticipant(meeting.id, createMockParticipants({ userId: 'myUserId' }));
});
describe('MeetingWaitingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the meeting is the active one', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingWaitingParticipantClashedEventHandler(event);
		expect(mockSendCustomEvent).toHaveBeenCalledWith({
			name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED,
			data: event
		});
	});
});
