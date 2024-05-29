/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingWaitingParticipantClashedEventHandler } from './MeetingWaitingParticipantClashedEventHandler';
import { CHATS_ROUTE, MEETINGS_PATH } from '../../../constants/appConstants';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingWaitingParticipantClashed } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingWaitingParticipantClashed = {
	type: WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'clashedUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.addParticipant(meeting.id, createMockParticipants({ userId: 'myUserId' }));
});
describe('MeetingWaitingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the clashed user is the session user and the session user is the waiting page', () => {
		event.userId = 'myUserId';
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingWaitingParticipantClashedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, { detail: event })
		);
	});

	test('A custom event is not sent if the clashed user is not the session user', () => {
		event.userId = 'clashedUserId';
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingWaitingParticipantClashedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if the session user is the chat page', () => {
		event.userId = 'myUserId';
		window.location.pathname = `https://localhost/carbonio/${CHATS_ROUTE}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingWaitingParticipantClashedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
