/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';

import { createMockMember, createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { TextMessage } from '../../types/store/MessageTypes';
import useStore from '../Store';

const room: RoomBe = createMockRoom({
	id: 'room-id',
	userSettings: { clearedAt: '2022-08-26T19:14:54.393Z' }, // 26 ago 2022, 19:14:54
	members: [
		createMockMember({ userId: 'user0' }),
		createMockMember({ userId: 'user1' }),
		createMockMember({ userId: 'user2' })
	]
});

const textMessage1: TextMessage = createMockTextMessage({ id: 'text-msg-1', roomId: room.id });
const textMessage2: TextMessage = createMockTextMessage({ id: 'text-msg-2', roomId: room.id });

describe('Test temporary messages slice', () => {
	it('add reference message', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addDeletedMessageRef(room.id, textMessage1));
		expect(result.current.temporaryRoomsMessagesReferences[room.id]).not.toBeNull();
		expect(result.current.temporaryRoomsMessagesReferences[room.id]).toHaveLength(1);
		expect(result.current.temporaryRoomsMessagesReferences[room.id][0]).toBe(textMessage1);

		act(() => result.current.addDeletedMessageRef(room.id, textMessage2));
		expect(result.current.temporaryRoomsMessagesReferences[room.id]).not.toBeNull();
		expect(result.current.temporaryRoomsMessagesReferences[room.id]).toHaveLength(2);
		expect(result.current.temporaryRoomsMessagesReferences[room.id][1]).toBe(textMessage2);
	});
});
