/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantHandRaisedHandler } from './MeetingParticipantHandRaisedHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/setupTests';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, meetingType: MeetingType.SCHEDULED });

const raisedEvent: MeetingParticipantHandRaisedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
	sentDate: '2022-01-01T03:00:00.000Z',
	meetingId: meeting.id,
	userId: 'myUserId',
	raised: true,
	handRaisedAt: '2022-01-01T00:00:00.000Z'
};

const lowerEvent: MeetingParticipantHandRaisedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
	sentDate: '2022-01-01T03:00:00.000Z',
	meetingId: meeting.id,
	userId: 'myUserId',
	raised: false,
	handRaisedAt: '2023-01-01T00:00:00.000Z'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});
describe('MeetingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the user is the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(raisedEvent);
		expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual(['myUserId']);
	});

	test('audio feedback is sent when a user raises his hand', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(raisedEvent);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('audio feedback is not sent a user lowers his hand', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(lowerEvent);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('audio feedback is not sent when there are already more that 3 people with hand raised', () => {
		useStore.getState().meetingConnection(meeting.id);
		const { setUserWithHandRaised } = useStore.getState();
		setUserWithHandRaised('user1', true);
		setUserWithHandRaised('user2', true);
		setUserWithHandRaised('user3', true);
		meetingParticipantHandRaisedHandler(raisedEvent);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});
});
