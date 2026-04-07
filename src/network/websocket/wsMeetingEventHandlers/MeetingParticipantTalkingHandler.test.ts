/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { meetingParticipantTalkingEventHandler } from './MeetingParticipantTalkingHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantTalkingEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingParticipantTalkingEvent = {
	type: WsEventType.MEETING_PARTICIPANT_TALKING,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	isTalking: true
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});
describe('meetingParticipantTalkingEventHandler tests', () => {
	test('Talking user information are saved only the meeting is active', () => {
		useStore.getState().meetingConnection(meeting.id);
		meetingParticipantTalkingEventHandler(event);
		expect(useStore.getState().activeMeeting?.talkingUsers).toContain('userId');
	});

	test('Talking user information are not  saved if the meeting is inactive', () => {
		const state = useStore.getState();
		state.meetingConnection(meeting.id);
		state.meetingDisconnection(meeting.id);
		meetingParticipantTalkingEventHandler(event);
		expect(useStore.getState().activeMeeting).toBeUndefined();
	});
});
