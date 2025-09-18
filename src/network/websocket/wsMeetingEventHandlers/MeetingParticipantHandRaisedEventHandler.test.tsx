/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantHandRaisedHandler } from './MeetingParticipantHandRaisedHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/mocks/global';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});

const room2 = createMockRoom({ id: 'groupWith10Participants', type: RoomType.GROUP });
const meetingWith21Participants = createMockMeeting({
	id: 'meetingWith12Participants',
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
		createMockParticipants({ userId: 'user11' }),
		createMockParticipants({ userId: 'user12' }),
		createMockParticipants({ userId: 'user13' }),
		createMockParticipants({ userId: 'user14' }),
		createMockParticipants({ userId: 'user15' }),
		createMockParticipants({ userId: 'user16' }),
		createMockParticipants({ userId: 'user17' }),
		createMockParticipants({ userId: 'user18' }),
		createMockParticipants({ userId: 'user19' }),
		createMockParticipants({ userId: 'user20' }),
		createMockParticipants({ userId: 'user21' })
	]
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

const raisedEvent2: MeetingParticipantHandRaisedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
	sentDate: '2022-01-01T00:10:00.000Z',
	meetingId: meetingWith21Participants.id,
	userId: 'myUserId',
	raised: true,
	handRaisedAt: '2022-01-01T00:00:00.000Z'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRooms([room, room2]);
	store.addMeetings([meeting, meetingWith21Participants]);
});
describe('MeetingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the user is the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(raisedEvent);
		expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual(['myUserId']);
	});

	test('audio feedback is sent when a user raised his hand', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(raisedEvent);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('audio feedback is not sent a user lower his hand', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantHandRaisedHandler(lowerEvent);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('audio feedback is not sent when users are more than 20', () => {
		useStore.getState().meetingConnection(meetingWith21Participants.id);
		meetingParticipantHandRaisedHandler(raisedEvent2);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});
});
