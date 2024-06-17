/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingWaitingParticipantJoinedEventHandler } from './MeetingWaitingParticipantJoinedEventHandler';
import { mockNotify } from '../../../../__mocks__/@zextras/carbonio-shell-ui';
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
import { MeetingWaitingParticipantJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingWaitingParticipantJoinedEvent = {
	type: WsEventType.MEETING_WAITING_PARTICIPANT_JOINED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'waitingUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.addParticipant(meeting.id, createMockParticipants({ userId: 'myUserId' }));
});
describe('MeetingWaitingParticipantJoinedEventHandler tests', () => {
	test('When a new user joins the waiting room and he is added to waiting list and a custom event is sent', () => {
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingWaitingParticipantJoinedEventHandler(event);
		expect(useStore.getState().meetings[room.id].waitingList).toContain(event.userId);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.NEW_WAITING_USER, { detail: event })
		);
	});

	test("Display a browser notification when an user joins the waiting room while I'm in the meeting tab", () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		meetingWaitingParticipantJoinedEventHandler(event);
		expect(mockNotify).toHaveBeenCalled();
	});

	test("Do not display a browser notification if an user joins the waiting room while I'm in the chats tab", () => {
		window.location.pathname = `https://localhost/carbonio/${CHATS_ROUTE}`;
		meetingWaitingParticipantJoinedEventHandler(event);
		expect(mockNotify).not.toHaveBeenCalled();
	});
});
