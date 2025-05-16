/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingLeftEventHandler } from './MeetingLeftEventHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/mocks/global';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingLeftEvent } from '../../../types/network/websocket/wsMeetingEvents';
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
	type: WsEventType.MEETING_LEFT,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId'
};

const event2: MeetingLeftEvent = {
	type: WsEventType.MEETING_LEFT,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meetingWith12Participants.id,
	userId: 'sessionUserId'
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRooms([room, room2]);
	store.addMeeting(meeting);
	store.addMeeting(meetingWith12Participants);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.addParticipant(meeting.id, createMockParticipants({ userId: event.userId }));
	store.meetingConnection(meetingWith12Participants.id, false, undefined, false, undefined);
	store.addParticipant(
		meetingWith12Participants.id,
		createMockParticipants({ userId: event2.userId })
	);
});
describe('meetingLeftEventHandler tests', () => {
	test('Left participant information are removed from store', () => {
		meetingLeftEventHandler(event);
		const meeting = useStore.getState().meetings[room.id];
		expect(meeting.participants[event.userId]).toBeUndefined();
	});

	test('Left participant video subscription is been removed', () => {
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		const subscriptionManager = activeMeeting.videoScreenIn?.subscriptionManager;
		const deleteSub = jest.spyOn(subscriptionManager as SubscriptionsManager, 'deleteSubscription');
		meetingLeftEventHandler(event);
		expect(deleteSub).toHaveBeenCalled();
	});

	test('Audio feedback is sent when session user is inside meeting', () => {
		useStore.getState().meetingConnection(meeting.id, false, undefined, false, undefined);
		meetingLeftEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('Audio feedback is not sent when participants are more than 10', () => {
		useStore
			.getState()
			.meetingConnection(meetingWith12Participants.id, false, undefined, false, undefined);
		meetingLeftEventHandler(event2);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Audio feedback is not sent outside active meeting', () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
		store.meetingDisconnection(meeting.id);
		meetingLeftEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Left participant is removed from talking users', () => {
		const store = useStore.getState();
		store.setTalkingUser(meeting.id, event.userId, true);
		meetingLeftEventHandler(event);
		expect(store.activeMeeting[meeting.id].talkingUsers).not.toContain(event.userId);
	});
});
