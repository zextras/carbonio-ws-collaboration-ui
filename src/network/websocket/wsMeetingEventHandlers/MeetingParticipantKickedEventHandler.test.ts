/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantKickedEventHandler } from './MeetingParticipantKickedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantKickedEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingParticipantKickedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_KICKED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'myUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});

describe('MeetingParticipantKickedEventHandler tests', () => {
	test('A custom event is sent if I am removed from the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id);
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingParticipantKickedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_PARTICIPANT_KICKED, { detail: event })
		);
	});

	test('A custom event is not sent if I am not inside the meeting', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingParticipantKickedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if another participant is removed', () => {
		useStore.getState().meetingConnection(meeting.id);
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingParticipantKickedEventHandler({ ...event, userId: 'otherUserId' });
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
