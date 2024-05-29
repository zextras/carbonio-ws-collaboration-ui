/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantClashedEventHandler } from './MeetingParticipantClashedEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantClashedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

const room = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [{ userId: 'myUserId', owner: true }]
});
const meeting = createMockMeeting({ roomId: room.id, type: MeetingType.SCHEDULED });

const event: MeetingParticipantClashedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_CLASHED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
});
describe('MeetingParticipantClashedEventHandler tests', () => {
	test('A custom event is sent if the user is the active meeting', () => {
		useStore.getState().meetingConnection(meeting.id, false, undefined, false, undefined);
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingParticipantClashedEventHandler(event);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_PARTICIPANT_CLASHED, { detail: event })
		);
	});

	test('A custom event is not sent if the user is not inside meeting', () => {
		const dispatchEvent = jest.spyOn(window, 'dispatchEvent');
		meetingParticipantClashedEventHandler(event);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
