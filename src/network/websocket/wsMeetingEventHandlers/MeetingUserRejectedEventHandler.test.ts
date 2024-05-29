/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingUserRejectedEventHandler } from './MeetingUserRejectedEventHandler';
import { CHATS_ROUTE, MEETINGS_PATH } from '../../../constants/appConstants';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingUserRejectedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({ type: RoomType.TEMPORARY });
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingUserRejectedEvent = {
	type: WsEventType.MEETING_USER_REJECTED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'rejectedId'
};

const iAmRejectedEvent: MeetingUserRejectedEvent = {
	type: WsEventType.MEETING_USER_REJECTED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'myUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.addUserToWaitingList(meeting.id, 'rejectedId');
});
describe('MeetingUserRejectedEventHandler tests', () => {
	test('Rejected user is removed from the waiting list', () => {
		meetingUserRejectedEventHandler(event);
		expect(useStore.getState().meetings[room.id].waitingList).not.toContain('rejectedId');
	});

	test('Do not send user rejected custom event if another user is rejected', () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserRejectedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('Send user rejected custom event only if the rejected user is session user session', () => {
		window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${meeting.id}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserRejectedEventHandler(iAmRejectedEvent);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_USER_REJECTED, { detail: iAmRejectedEvent })
		);
	});

	test('Do not send user rejected custom event if user is in the chat page', () => {
		window.location.pathname = `https://localhost/carbonio/${CHATS_ROUTE}`;
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingUserRejectedEventHandler(iAmRejectedEvent);
		expect(dispatchEvent).not.toHaveBeenCalledWith();
	});
});
