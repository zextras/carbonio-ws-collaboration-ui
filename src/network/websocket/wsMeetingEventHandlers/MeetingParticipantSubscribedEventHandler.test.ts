/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantSubscribedEventHandler } from './MeetingParticipantSubscribedEventHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { IVideoScreenInConnection } from '../../../types/network/webRTC/webRTC';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantSubscribedEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingParticipantSubscribedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_SUBSCRIBED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	streams: []
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('meetingParticipantSubscribedEventHandler tests', () => {
	test('handleParticipantsSubscribed is been called when the meeting is active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		const { videoScreenIn } = useStore.getState().activeMeeting[meeting.id];
		const handleParticipantsSubscribed = jest.spyOn(
			videoScreenIn as IVideoScreenInConnection,
			'handleParticipantsSubscribed'
		);
		meetingParticipantSubscribedEventHandler(event);
		expect(handleParticipantsSubscribed).toHaveBeenCalled();
	});

	test('handleParticipantsSubscribed is not been called when the meeting is not active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		meetingParticipantSubscribedEventHandler(event);
		expect(activeMeeting).toBeUndefined();
	});
});
