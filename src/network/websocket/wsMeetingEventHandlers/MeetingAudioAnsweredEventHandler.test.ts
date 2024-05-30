/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingAudioAnsweredEventHandler } from './MeetingAudioAnsweredEventHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { IBidirectionalConnectionAudioInOut } from '../../../types/network/webRTC/webRTC';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingAudioAnsweredEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingAudioAnsweredEvent = {
	type: WsEventType.MEETING_AUDIO_ANSWERED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	sdp: 'sdp'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('meetingAudioAnsweredEventHandler tests', () => {
	test('handleRemoteAnswer is been called when the meeting is active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		const { bidirectionalAudioConn } = useStore.getState().activeMeeting[meeting.id];
		const handleRemoteAnswer = jest.spyOn(
			bidirectionalAudioConn as IBidirectionalConnectionAudioInOut,
			'handleRemoteAnswer'
		);
		meetingAudioAnsweredEventHandler(event);
		expect(handleRemoteAnswer).toHaveBeenCalled();
	});

	test('handleRemoteAnswer is not been called when the meeting is not active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		meetingAudioAnsweredEventHandler(event);
		expect(activeMeeting).toBeUndefined();
	});
});
