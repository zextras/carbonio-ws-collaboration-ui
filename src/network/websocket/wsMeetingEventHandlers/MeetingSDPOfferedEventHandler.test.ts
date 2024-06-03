/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingSDPOfferedEventHandler } from './MeetingSDPOfferedEventHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { IVideoScreenInConnection } from '../../../types/network/webRTC/webRTC';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingSDPOfferedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingSDPOfferedEvent = {
	type: WsEventType.MEETING_SDP_OFFERED,
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
describe('meetingSDPOfferedEventHandler tests', () => {
	test('handleRemoteOffer is been called when the meeting is active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		const { videoScreenIn } = useStore.getState().activeMeeting[meeting.id];
		const handleRemoteOffer = jest.spyOn(
			videoScreenIn as IVideoScreenInConnection,
			'handleRemoteOffer'
		);
		meetingSDPOfferedEventHandler(event);
		expect(handleRemoteOffer).toHaveBeenCalled();
	});

	test('handleRemoteOffer is not been called when the meeting is not active', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		meetingSDPOfferedEventHandler(event);
		expect(activeMeeting).toBeUndefined();
	});
});
