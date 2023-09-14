/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

import { wsEventsHandler } from './wsEventsHandler';
import { mockedGetMeetingRequest, mockedGetRoomRequest } from '../../../jest-mocks';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import {
	RoomMemberAddedEvent,
	RoomMemberRemovedEvent
} from '../../types/network/websocket/wsConversationEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const member1: MemberBe = {
	userId: user1.id,
	owner: false,
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

const user3Participant: MeetingParticipant = createMockParticipants({
	userId: user3.id,
	sessionId: 'sessionIdUser3'
});
const user2Participant: MeetingParticipant = createMockParticipants({
	userId: user2.id,
	sessionId: 'sessionIdUser2'
});

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
});
