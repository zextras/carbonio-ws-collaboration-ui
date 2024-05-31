/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	EventArea,
	getEventArea,
	inThisMeetingTab,
	isMeetingActive,
	isMyId
} from './eventHandlersUtilities';
import { CHATS_ROUTE, MEETINGS_PATH } from '../../constants/appConstants';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom } from '../../tests/createMock';
import { WsEventType } from '../../types/network/websocket/wsEvents';

const room = createMockRoom({ id: 'roomId' });
const meeting = createMockMeeting({ id: 'meetingId', roomId: room.id });

const activeRoom = createMockRoom({ id: 'activeRoom' });
const activeMeeting = createMockMeeting({ id: 'activeMeeting', roomId: activeRoom.id });

export const conversationEvents = [
	WsEventType.ROOM_CREATED,
	WsEventType.ROOM_UPDATED,
	WsEventType.ROOM_DELETED,
	WsEventType.ROOM_OWNER_PROMOTED,
	WsEventType.ROOM_OWNER_DEMOTED,
	WsEventType.ROOM_PICTURE_CHANGED,
	WsEventType.ROOM_PICTURE_DELETED,
	WsEventType.ROOM_MEMBER_ADDED,
	WsEventType.ROOM_MEMBER_REMOVED,
	WsEventType.ROOM_MUTED,
	WsEventType.ROOM_UNMUTED,
	WsEventType.USER_PICTURE_CHANGED,
	WsEventType.USER_PICTURE_DELETED,
	WsEventType.ROOM_HISTORY_CLEARED
];

export const meetingEvents = [
	WsEventType.MEETING_CREATED,
	WsEventType.MEETING_STARTED,
	WsEventType.MEETING_JOINED,
	WsEventType.MEETING_LEFT,
	WsEventType.MEETING_STOPPED,
	WsEventType.MEETING_DELETED,
	WsEventType.MEETING_AUDIO_STREAM_CHANGED,
	WsEventType.MEETING_MEDIA_STREAM_CHANGED,
	WsEventType.MEETING_AUDIO_ANSWERED,
	WsEventType.MEETING_SDP_OFFERED,
	WsEventType.MEETING_SDP_ANSWERED,
	WsEventType.MEETING_PARTICIPANT_SUBSCRIBED,
	WsEventType.MEETING_PARTICIPANT_TALKING,
	WsEventType.MEETING_PARTICIPANT_CLASHED,
	WsEventType.MEETING_WAITING_PARTICIPANT_JOINED,
	WsEventType.MEETING_USER_ACCEPTED,
	WsEventType.MEETING_USER_REJECTED,
	WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED,
	WsEventType.MEETING_RECORDING_STARTED,
	WsEventType.MEETING_RECORDING_STOPPED
];

describe('eventHandlersUtilities tests', () => {
	describe('getEventArea tests', () => {
		test('Event area is GENERAL for initialization and pong events', () => {
			expect(getEventArea(WsEventType.INITIALIZATION)).toBe(EventArea.GENERAL);
			expect(getEventArea(WsEventType.PONG)).toBe(EventArea.GENERAL);
		});

		test.each(conversationEvents)('Event area is CONVERSATION for %s', (event) => {
			expect(getEventArea(event)).toBe(EventArea.CONVERSATION);
		});

		test.each(meetingEvents)('Event area is MEETING for %s', (event) => {
			expect(getEventArea(event)).toBe(EventArea.MEETING);
		});

		test('Event area is undefined for unknown events', () => {
			expect(getEventArea('unknownEvent' as WsEventType)).toBe(undefined);
		});
	});

	describe('isMyId tests', () => {
		test('isMyId returns true if the id is the same as the session userId', () => {
			useStore.getState().setLoginInfo('userId', 'User');
			expect(isMyId('userId')).toBe(true);
		});

		test('isMyId returns false if the id is different from the session userId', () => {
			useStore.getState().setLoginInfo('userId', 'User');
			expect(isMyId('otherId')).toBe(false);
		});
	});

	beforeEach(() => {
		const store = useStore.getState();
		store.addRoom(room);
		store.addMeeting(meeting);
		store.addRoom(activeRoom);
		store.addMeeting(activeMeeting);
		store.meetingConnection(activeMeeting.id, false, undefined, false, undefined);
	});
	describe('isMeetingActive tests', () => {
		test('isMeetingActive returns false if the user never connected to it', () => {
			expect(isMeetingActive(meeting.id)).toBe(false);
		});

		test('isMeetingActive returns true if the user connects to it', () => {
			expect(isMeetingActive(activeMeeting.id)).toBe(true);
		});

		test('isMeetingActive returns false if the connected and disconnected from it', () => {
			const store = useStore.getState();
			store.meetingConnection(meeting.id, false, undefined, false, undefined);
			store.meetingDisconnection(meeting.id);
			expect(isMeetingActive('nonExistentMeeting')).toBe(false);
		});
	});

	describe('inThisMeetingTab tests', () => {
		test('inThisMeetingTab returns true if user is in a meeting page', () => {
			window.location.pathname = `https://localhost/carbonio/${MEETINGS_PATH}${activeMeeting.id}`;
			expect(inThisMeetingTab(activeMeeting.id)).toBe(true);
		});

		test('inThisMeetingTab returns false if the user is in the chat page', () => {
			window.location.pathname = `https://localhost/carbonio/${CHATS_ROUTE}`;
			expect(isMeetingActive(meeting.id)).toBe(false);
		});
	});
});
