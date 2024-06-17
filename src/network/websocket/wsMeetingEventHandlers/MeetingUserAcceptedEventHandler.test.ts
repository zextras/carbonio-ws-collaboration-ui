/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingUserAcceptedEventHandler } from './MeetingUserAcceptedEventHandler';
import { CHATS_ROUTE, MEETINGS_PATH } from '../../../constants/appConstants';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingUserAcceptedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({ type: RoomType.TEMPORARY });
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingUserAcceptedEvent = {
	type: WsEventType.MEETING_USER_ACCEPTED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'acceptedId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.addUserToWaitingList(meeting.id, 'acceptedId');
});
describe('MeetingUserAcceptedEventHandler tests', () => {
	test('Accepted user is removed from the waiting list', () => {
		meetingUserAcceptedEventHandler(event);
		expect(useStore.getState().meetings[room.id].waitingList).not.toContain('acceptedId');
	});

	test('Do not send user accepted custom event if another user is accepted', () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserAcceptedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Send user accepted custom event only if the accepted user is session user session', () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		event.userId = 'myUserId';
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserAcceptedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_USER_ACCEPTED, { detail: event })
		);
	});

	test('Do not send user accepted custom event if user is in the chat page', () => {
		window.location.pathname = `https://localhost/carbonio/${CHATS_ROUTE}`;
		event.userId = 'myUserId';
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserAcceptedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalledWith();
	});
});
