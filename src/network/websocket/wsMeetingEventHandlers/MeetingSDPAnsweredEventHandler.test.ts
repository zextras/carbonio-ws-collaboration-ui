/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingSDPAnsweredEventHandler } from './MeetingSDPAnsweredEventHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { IScreenOutConnection, IVideoOutConnection } from '../../../types/network/webRTC/webRTC';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingSDPAnsweredEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingSDPAnsweredEvent = {
	type: WsEventType.MEETING_SDP_ANSWERED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	sdp: 'sdp',
	mediaType: STREAM_TYPE.VIDEO
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('meetingSDPAnsweredEventHandler tests', () => {
	test('handleRemoteAnswer is not been called when the meeting is not active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		meetingSDPAnsweredEventHandler(event);
		expect(activeMeeting).toBeUndefined();
	});

	test('videoIn handleRemoteAnswer is been called when the stream is a video', () => {
		event.mediaType = STREAM_TYPE.VIDEO;
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		const { videoOutConn } = useStore.getState().activeMeeting[meeting.id];
		const handleRemoteAnswer = jest.spyOn(
			videoOutConn as IVideoOutConnection,
			'handleRemoteAnswer'
		);
		meetingSDPAnsweredEventHandler(event);
		expect(handleRemoteAnswer).toHaveBeenCalled();
	});

	test('screenOut handleRemoteAnswer is been called when the stream is a screen', () => {
		event.mediaType = STREAM_TYPE.SCREEN;
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		const { screenOutConn } = useStore.getState().activeMeeting[meeting.id];
		const handleRemoteAnswer = jest.spyOn(
			screenOutConn as IScreenOutConnection,
			'handleRemoteAnswer'
		);
		meetingSDPAnsweredEventHandler(event);
		expect(handleRemoteAnswer).toHaveBeenCalled();
	});
});
