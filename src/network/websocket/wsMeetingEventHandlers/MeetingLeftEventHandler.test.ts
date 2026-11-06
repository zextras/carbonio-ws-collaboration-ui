/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingLeftEventHandler } from './MeetingLeftEventHandler';
import { EventName } from '../../../hooks/useEventListener';
import { getActiveMeeting } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import {
	MeetingLeftEvent,
	MeetingLeftReason
} from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';
import SubscriptionsManager from '../../webRTC/SubscriptionsManager';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const room2 = createMockRoom({ id: 'groupWith10Participants', type: RoomType.GROUP });
const meetingWith12Participants = createMockMeeting({
	id: 'meetingWith12Participants',
	roomId: room2.id,
	participants: [
		createMockParticipants({ userId: 'user1' }),
		createMockParticipants({ userId: 'user2' }),
		createMockParticipants({ userId: 'user3' }),
		createMockParticipants({ userId: 'user4' }),
		createMockParticipants({ userId: 'user5' }),
		createMockParticipants({ userId: 'user6' }),
		createMockParticipants({ userId: 'user7' }),
		createMockParticipants({ userId: 'user8' }),
		createMockParticipants({ userId: 'user9' }),
		createMockParticipants({ userId: 'user10' }),
		createMockParticipants({ userId: 'user11' }),
		createMockParticipants({ userId: 'user12' })
	]
});
const event: MeetingLeftEvent = {
	type: WsEventType.MEETING_PARTICIPANT_LEFT,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	reason: MeetingLeftReason.LEFT
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'myUserId', name: 'User' });
	store.addRooms([room, room2]);
	store.addMeetings([meeting, meetingWith12Participants]);
	store.meetingConnection(meeting.id);
	store.addParticipant(meeting.id, createMockParticipants({ userId: event.userId }));
});
describe('meetingLeftEventHandler tests', () => {
	test('Left participant information are removed from store', () => {
		meetingLeftEventHandler(event);
		const meet = useStore.getState().meetings[meeting.id];
		expect(meet.participants[event.userId]).toBeUndefined();
	});

	test('Left participant video subscription is been removed', () => {
		const activeMeeting = getActiveMeeting(useStore.getState(), meeting.id);
		const subscriptionManager = activeMeeting?.videoScreenIn?.subscriptionManager;
		const deleteSub = vi.spyOn(subscriptionManager as SubscriptionsManager, 'deleteSubscription');
		meetingLeftEventHandler(event);
		expect(deleteSub).toHaveBeenCalled();
	});

	test('Left participant is removed from talking users', () => {
		const store = useStore.getState();
		store.setTalkingUser(event.userId, true);
		meetingLeftEventHandler(event);
		expect(store.activeMeeting?.talkingUsers).not.toContain(event.userId);
	});
});

describe('meetingLeftEventHandler kick tests', () => {
	const kickedEvent: MeetingLeftEvent = {
		...event,
		userId: 'myUserId',
		reason: MeetingLeftReason.KICKED
	};

	test('A custom event is sent if I am removed from the active meeting', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingLeftEventHandler(kickedEvent);
		expect(dispatchEvent).toHaveBeenCalledWith(
			new CustomEvent(EventName.MEETING_PARTICIPANT_KICKED, { detail: kickedEvent })
		);
	});

	test('A custom event is not sent if I am not inside the meeting', () => {
		useStore.getState().meetingDisconnection(meeting.id);
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingLeftEventHandler(kickedEvent);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if another participant is removed', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingLeftEventHandler({ ...kickedEvent, userId: 'otherUserId' });
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	test('A custom event is not sent if I leave on my own', () => {
		const dispatchEvent = vi.spyOn(window, 'dispatchEvent');
		meetingLeftEventHandler({ ...kickedEvent, reason: MeetingLeftReason.LEFT });
		expect(dispatchEvent).not.toHaveBeenCalled();
	});
});
