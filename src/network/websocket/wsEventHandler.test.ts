/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { conversationEvents, meetingEvents } from './eventHandlersUtilities.test';
import * as WsConversationEventsHandler from './wsConversationEventsHandler';
import { wsEventsHandler } from './wsEventsHandler';
import * as WsMeetingEventsHandler from './wsMeetingEventHandlers/wsMeetingEventsHandler';
import useStore from '../../store/Store';
import { createMockRoom, createMockUser } from '../../tests/createMock';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { WsEvent } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

const member1: MemberBe = { userId: user1.id, owner: false };
const member2: MemberBe = { userId: user2.id, owner: true };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2]
});

const storeSetup = (): void => {
	const store = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
};

describe('wsEventHandler tests', () => {
	test.each(conversationEvents)('should handle %s', (event) => {
		// storeSetup();
		const handler = jest.spyOn(WsConversationEventsHandler, 'wsConversationEventsHandler');
		const wsEvent = { type: event } as WsEvent;
		wsEventsHandler(wsEvent);
		expect(handler).toHaveBeenCalledWith(wsEvent);
	});

	test.each(meetingEvents)('should handle %s', (event) => {
		const handler = jest.spyOn(WsMeetingEventsHandler, 'wsMeetingEventsHandler');
		const wsEvent = { type: event } as WsEvent;
		wsEventsHandler(wsEvent);
		expect(handler).toHaveBeenCalledWith(wsEvent);
	});
});
