/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantHandRaisedHandler } from './MeetingParticipantHandRaisedHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, meetingType: MeetingType.SCHEDULED });

const event: MeetingParticipantHandRaisedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'myUserId',
	raised: true,
	handRaisedAt: '2022-01-01T00:00:00.000Z'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('MeetingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the user is the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id, false, undefined, false, undefined);
		meetingParticipantHandRaisedHandler(event);
		expect(useStore.getState().activeMeeting[meeting.id].usersWithHandRaised).toStrictEqual([
			'myUserId'
		]);
	});
});
