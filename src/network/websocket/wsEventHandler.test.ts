/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

import { wsEventsHandler } from './wsEventsHandler';
import { mockNotify } from '../../../__mocks__/@zextras/carbonio-shell-ui';
import { CHATS_ROUTE, MEETINGS_PATH } from '../../constants/appConstants';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { mockedGetMeetingRequest, mockedGetRoomRequest } from '../../tests/mocks/network';
import { MeetingBe, MeetingType } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import {
	RoomMemberAddedEvent,
	RoomMemberRemovedEvent
} from '../../types/network/websocket/wsConversationEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { LOCAL_STORAGE_NAMES } from '../../utils/localStorageUtils';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const member1: MemberBe = {
	userId: user1.id,
	owner: true,
	temporary: false,
	external: false
};

const member2: MemberBe = {
	userId: user2.id,
	owner: true,
	temporary: false,
	external: false
};

const member3: MemberBe = {
	userId: user3.id,
	owner: false,
	temporary: false,
	external: false
};

const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });
const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });
const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });

const meeting: MeetingBe = createMockMeeting({
	id: 'meetingId',
	roomId: 'id',
	participants: [user3Participant, user2Participant]
});

const room: RoomBe = createMockRoom({
	id: 'id',
	name: 'Room With Me',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3],
	meetingId: meeting.id
});

const roomWithoutMe: RoomBe = createMockRoom({
	id: 'id',
	name: 'Room Without Me',
	description: '',
	type: RoomType.GROUP,
	members: [member2, member3],
	meetingId: meeting.id
});

const temporaryRoom: RoomBe = createMockRoom({ type: RoomType.TEMPORARY, members: [member1] });

const scheduledMeeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	type: MeetingType.SCHEDULED,
	participants: [user1Participant]
});

describe('wsEventHandler', () => {
	test('Room Member Added in a room with an ongoing meeting', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo(user1);
			result.current.setUserInfo(user2);
			result.current.setUserInfo(user3);
			result.current.setLoginInfo(user1.id, user1.name);
			result.current.setSessionId('sessionIdUser1');
			result.current.addRoom(room);
		});

		mockedGetRoomRequest.mockReturnValue(room);
		mockedGetMeetingRequest.mockReturnValue(meeting);

		wsEventsHandler({
			type: WsEventType.ROOM_MEMBER_ADDED,
			roomId: room.id,
			userId: user1.id,
			sentDate: '123456789'
		} as RoomMemberAddedEvent);
		await waitFor(() => expect(result.current.meetings[room.id]).not.toBeUndefined());
	});

	test('Room Member Removed in a room with an ongoing meeting', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setUserInfo(user1);
			result.current.setUserInfo(user2);
			result.current.setUserInfo(user3);
			result.current.setLoginInfo(user1.id, user1.name);
			result.current.setSessionId('sessionIdUser1');
			result.current.addRoom(roomWithoutMe);
			result.current.addMeeting(meeting);
			wsEventsHandler({
				type: WsEventType.ROOM_MEMBER_REMOVED,
				roomId: roomWithoutMe.id,
				userId: member1.userId,
				sentDate: '123456789'
			} as RoomMemberRemovedEvent);
		});

		await waitFor(() => expect(result.current.meetings[roomWithoutMe.id]).toBeUndefined());
	});

	beforeEach(() => {
		const store = useStore.getState();
		store.setLoginInfo(user1.id, 'user1');
		store.addRoom(temporaryRoom);
		store.addMeeting(scheduledMeeting);
		store.meetingConnection(scheduledMeeting.id, false, undefined, false, undefined);
	});
	describe('Waiting room events', () => {
		test("An user joins the waiting room while I'm in the meeting tab", () => {
			window.history.pushState({}, '', `${MEETINGS_PATH}${scheduledMeeting.id}`);
			localStorage.setItem(
				LOCAL_STORAGE_NAMES.NOTIFICATIONS,
				JSON.stringify({
					DesktopNotifications: true,
					DesktopNotificationsSounds: true,
					WaitingRoomAccessNotifications: true,
					WaitingRoomAccessNotificationsSounds: true
				})
			);
			wsEventsHandler({
				type: WsEventType.MEETING_WAITING_PARTICIPANT_JOINED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { waitingList } = useStore.getState().meetings[temporaryRoom.id];
			expect(waitingList).toContain(user1.id);
			expect(mockNotify).toBeCalled();
		});

		test("An user joins the waiting room while I'm in the chats tab", () => {
			window.history.pushState({}, '', CHATS_ROUTE);
			wsEventsHandler({
				type: WsEventType.MEETING_WAITING_PARTICIPANT_JOINED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { waitingList } = useStore.getState().meetings[temporaryRoom.id];
			expect(waitingList).toContain(user1.id);
			expect(mockNotify).not.toBeCalled();
		});

		test('An user is accepted in the waiting room', () => {
			window.history.pushState({}, '', `${MEETINGS_PATH}${scheduledMeeting.id}`);
			useStore.getState().addUserToWaitingList(scheduledMeeting.id, user1.id);
			wsEventsHandler({
				type: WsEventType.MEETING_USER_ACCEPTED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { waitingList } = useStore.getState().meetings[temporaryRoom.id];
			expect(waitingList).not.toContain(user1.id);
		});

		test('An user is rejected in the waiting room', () => {
			window.history.pushState({}, '', `${MEETINGS_PATH}${scheduledMeeting.id}`);
			useStore.getState().addUserToWaitingList(scheduledMeeting.id, user1.id);
			wsEventsHandler({
				type: WsEventType.MEETING_USER_REJECTED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { waitingList } = useStore.getState().meetings[temporaryRoom.id];
			expect(waitingList).not.toContain(user1.id);
		});
	});

	beforeEach(() => {
		const store = useStore.getState();
		store.setLoginInfo(user1.id, 'user1');
		store.addRoom(temporaryRoom);
		store.addMeeting(scheduledMeeting);
		store.meetingConnection(scheduledMeeting.id, false, undefined, false, undefined);
	});
	describe('Recording events', () => {
		test('Recording started', () => {
			window.history.pushState({}, '', `${MEETINGS_PATH}${scheduledMeeting.id}`);
			wsEventsHandler({
				type: WsEventType.MEETING_RECORDING_STARTED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { recStartedAt, recUserId } = useStore.getState().meetings[temporaryRoom.id];
			expect(recStartedAt).toBe('123456789');
			expect(recUserId).toBe(user1.id);
		});

		test('Recording stopped', () => {
			window.history.pushState({}, '', `${MEETINGS_PATH}${scheduledMeeting.id}`);
			wsEventsHandler({
				type: WsEventType.MEETING_RECORDING_STOPPED,
				meetingId: scheduledMeeting.id,
				userId: user1.id,
				sentDate: '123456789'
			});
			const { recStartedAt, recUserId } = useStore.getState().meetings[temporaryRoom.id];
			expect(recStartedAt).toBeUndefined();
			expect(recUserId).toBeUndefined();
		});
	});
});
