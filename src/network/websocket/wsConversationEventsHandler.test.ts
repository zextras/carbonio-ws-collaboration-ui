/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import * as presenceRefresh from './presenceRefresh';
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

const SENT_DATE = '2023-01-01T00:00:00.000Z';

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
			sentDate: SENT_DATE
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
			sentDate: SENT_DATE,
			roomId: room.id,
			userId: sessionUser.id
		} as RoomMemberRemovedEvent);
		await waitFor(() => {
			const meeting = getMeetingByRoomId(useStore.getState(), room.id);
			expect(meeting).toBeUndefined();
		});
	});

	describe('presence refresh on a v2 backend', () => {
		beforeEach(() => {
			useStore.getState().setApiVersion('2.0.0');
		});
		afterEach(() => {
			useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
		});

		test('ROOM_CREATED fetches the presence of the members', async () => {
			const refreshSpy = vi.spyOn(presenceRefresh, 'refreshPresence').mockImplementation(() => {});
			vi.spyOn(api, 'getRoom').mockResolvedValue(
				createMockRoom({ id: 'newRoom', members: [{ userId: 'a', owner: true }] })
			);

			wsConversationEventsHandler({
				type: WsEventType.ROOM_CREATED,
				roomId: 'newRoom',
				sentDate: SENT_DATE
			} as never);

			await waitFor(() => expect(refreshSpy).toHaveBeenCalledWith(['a']));
		});

		test('ROOM_MEMBER_ADDED of another user fetches that user presence', () => {
			const refreshSpy = vi.spyOn(presenceRefresh, 'refreshPresence').mockImplementation(() => {});

			wsConversationEventsHandler({
				type: WsEventType.ROOM_MEMBER_ADDED,
				roomId: room.id,
				userId: 'other',
				sentDate: SENT_DATE
			} as RoomMemberAddedEvent);

			expect(refreshSpy).toHaveBeenCalledWith(['other']);
		});

		test('ROOM_MEMBER_ADDED of the session user fetches the presence of the room members', async () => {
			const refreshSpy = vi.spyOn(presenceRefresh, 'refreshPresence').mockImplementation(() => {});
			vi.spyOn(api, 'getRoom').mockResolvedValue(
				createMockRoom({ id: 'roomId', members: [{ userId: 'x', owner: false }] })
			);

			wsConversationEventsHandler({
				type: WsEventType.ROOM_MEMBER_ADDED,
				roomId: room.id,
				userId: sessionUser.id,
				sentDate: SENT_DATE
			} as RoomMemberAddedEvent);

			await waitFor(() => expect(refreshSpy).toHaveBeenCalledWith(['x']));
		});

		test('nothing is fetched on 1.6.x', () => {
			useStore.getState().setApiVersion('1.6.14');
			const refreshSpy = vi.spyOn(presenceRefresh, 'refreshPresence');

			wsConversationEventsHandler({
				type: WsEventType.ROOM_MEMBER_ADDED,
				roomId: room.id,
				userId: 'other',
				sentDate: SENT_DATE
			} as RoomMemberAddedEvent);

			expect(refreshSpy).not.toHaveBeenCalled();
		});
	});
});
