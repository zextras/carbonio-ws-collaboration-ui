/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { createMockMember, createMockRoom, createMockUser } from '../../tests/createMock';
import { MessageType } from '../../types/store/ChatDataTypes';
import { RoomType } from '../../types/store/RoomTypes';
import useStore from '../Store';

const user1 = createMockUser({ id: 'user1' });

const room1 = createMockRoom({
	id: 'room1-id',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id })]
});

describe('RoomsStoreSlice tests', () => {
	describe('Placeholder room', () => {
		test('Placeholder message is added to the room', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setPlaceholderRoom(user1.id);
			});

			const placeholderRoomId = `placeholder-${user1.id}`;
			expect(result.current.rooms[placeholderRoomId]).toEqual(
				expect.objectContaining({
					id: `placeholder-${user1.id}`,
					type: RoomType.ONE_TO_ONE
				})
			);

			expect(result.current.activeConversations[placeholderRoomId]).toEqual(
				expect.objectContaining({
					isHistoryFullyLoaded: true
				})
			);

			expect(result.current.chatData[placeholderRoomId].messages[0]).toEqual(
				expect.objectContaining({
					type: MessageType.DATE_MSG
				})
			);
		});

		test('Placeholder message is removed from the room', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.setPlaceholderRoom(user1.id);
				result.current.replacePlaceholderRoom(user1.id, room1.id);
			});

			const placeholderRoomId = `placeholder-${user1.id}`;
			expect(result.current.rooms[placeholderRoomId]).toBeUndefined();
			expect(result.current.activeConversations[placeholderRoomId]).toBeUndefined();
			expect(result.current.chatData[placeholderRoomId]?.messages).toBeUndefined();

			expect(result.current.rooms[room1.id]).toBeDefined();
		});
	});
});
