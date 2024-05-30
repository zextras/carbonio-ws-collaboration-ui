/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingMediaStreamChangedEventHandler } from './MeetingMediaStreamChangedEventHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/mocks/global';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingMediaStreamChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import SubscriptionsManager from '../../webRTC/SubscriptionsManager';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingMediaStreamChangedEvent = {
	type: WsEventType.MEETING_MEDIA_STREAM_CHANGED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	mediaType: STREAM_TYPE.VIDEO,
	active: true
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('myUserId', 'User');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.addParticipant(meeting.id, createMockParticipants({ userId: event.userId }));
});
describe('meetingMediaStreamChangedEventHandler tests', () => {
	test('New stream status information are saved into store', () => {
		meetingMediaStreamChangedEventHandler(event);
		const meeting = useStore.getState().meetings[room.id];
		expect(meeting.participants[event.userId].videoStreamOn).toBe(event.active);
	});

	test('Screen share is pinned when active', () => {
		event.mediaType = STREAM_TYPE.SCREEN;
		meetingMediaStreamChangedEventHandler(event);
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		expect(activeMeeting.pinnedTile).toHaveProperty('userId', event.userId);
		expect(activeMeeting.pinnedTile).toHaveProperty('type', event.mediaType);
	});

	test('Audio feedback is sent when screen sharing', () => {
		event.mediaType = STREAM_TYPE.SCREEN;
		meetingMediaStreamChangedEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('Audio feedback is not sent for new screen sharing outside active meeting', () => {
		event.mediaType = STREAM_TYPE.SCREEN;
		useStore.getState().meetingDisconnection(meeting.id);
		meetingMediaStreamChangedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Audio feedback is not sent for new video', () => {
		event.mediaType = STREAM_TYPE.VIDEO;
		meetingMediaStreamChangedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('RemoveSubscription is been called when new stream is inactive', () => {
		event.active = false;
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		const subscriptionManager = activeMeeting.videoScreenIn?.subscriptionManager;
		const removeSub = jest.spyOn(subscriptionManager as SubscriptionsManager, 'removeSubscription');
		meetingMediaStreamChangedEventHandler(event);
		expect(removeSub).toHaveBeenCalled();
	});

	test('AddSubscription is been called when new stream is active', () => {
		event.active = true;
		const activeMeeting = useStore.getState().activeMeeting[meeting.id];
		const subscriptionManager = activeMeeting.videoScreenIn?.subscriptionManager;
		const addSub = jest.spyOn(subscriptionManager as SubscriptionsManager, 'addSubscription');
		meetingMediaStreamChangedEventHandler(event);
		expect(addSub).toHaveBeenCalled();
	});
});
