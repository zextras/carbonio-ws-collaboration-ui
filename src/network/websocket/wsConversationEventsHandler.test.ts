/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { wsConversationEventsHandler } from './wsConversationEventsHandler';
import { wsEventsHandler } from './wsEventsHandler';
import { getMeetingByRoomId } from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom, createMockUser } from '../../tests/createMock';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import {
	RoomMemberAddedEvent,
	RoomMemberRemovedEvent
} from '../../types/network/websocket/wsConversationEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import * as api from '../index';

const sessionUser = createMockUser({ id: 'sessionUserId', name: 'session user' });

const meeting: MeetingBe = createMockMeeting({
	id: 'meetingId',
	roomId: 'roomId'
});

const room: RoomBe = createMockRoom({
	id: 'roomId',
	name: 'Room With Me',
	meetingId: meeting.id
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.addRooms([room]);
});

describe('wsConversationEventHandler tests', () => {
	test('ROOM_MEMBER_ADDED: session user is added in a room with an ongoing meeting', async () => {
		const spyOnGetRoom = vi.spyOn(api, 'getRoom');
		const spyOnGetMeeting = vi.spyOn(api, 'getMeeting');
		spyOnGetRoom.mockImplementation(() => Promise.resolve(room));
		spyOnGetMeeting.mockImplementation(() => Promise.resolve(meeting));

		wsConversationEventsHandler({
			type: WsEventType.ROOM_MEMBER_ADDED,
			roomId: room.id,
			userId: sessionUser.id,
			sentDate: '2023-01-01T00:00:00.000Z'
		} as RoomMemberAddedEvent);
		await waitFor(() => {
			const meeting = getMeetingByRoomId(useStore.getState(), room.id);
			expect(meeting).toBeDefined();
		});
	});

	test('ROOM_MEMBER_REMOVED: session user is removed from a room with an ongoing meeting', async () => {
		useStore.getState().addMeetings([meeting]);
		wsEventsHandler({
			type: WsEventType.ROOM_MEMBER_REMOVED,
			sentDate: '2023-01-01T00:00:00.000Z',
			roomId: room.id,
			userId: sessionUser.id
		} as RoomMemberRemovedEvent);
		await waitFor(() => {
			const meeting = getMeetingByRoomId(useStore.getState(), room.id);
			expect(meeting).toBeUndefined();
		});
	});
});
