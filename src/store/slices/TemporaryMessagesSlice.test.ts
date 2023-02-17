/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

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

const textMessage1 = createMockTextMessage({ id: 'text-msg-1', roomId: room.id } as TextMessage);
const textMessage2 = createMockTextMessage({ id: 'text-msg-2', roomId: room.id } as TextMessage);

describe('Test temporary messages slice', () => {
	it('add reference message deleted', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addDeletedMessageRef(room.id, textMessage1));
		expect(result.current.temporaryMessages[room.id]).not.toBeNull();
		expect(size(result.current.temporaryMessages[room.id])).toBe(1);
		expect(result.current.temporaryMessages[room.id][`deleted_${textMessage1.id}`]).toBe(
			textMessage1
		);

		act(() => result.current.addDeletedMessageRef(room.id, textMessage2));
		expect(result.current.temporaryMessages[room.id]).not.toBeNull();
		expect(size(result.current.temporaryMessages[room.id])).toBe(2);
		expect(result.current.temporaryMessages[room.id][`deleted_${textMessage2.id}`]).toBe(
			textMessage2
		);
	});

	it('add reference message edited', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addEditedMessageRef(room.id, textMessage1));
		expect(result.current.temporaryMessages[room.id]).not.toBeNull();
		expect(size(result.current.temporaryMessages[room.id])).toBe(1);
		expect(result.current.temporaryMessages[room.id][`edited_${textMessage1.id}`]).toBe(
			textMessage1
		);

		act(() => result.current.addEditedMessageRef(room.id, textMessage2));
		expect(result.current.temporaryMessages[room.id]).not.toBeNull();
		expect(size(result.current.temporaryMessages[room.id])).toBe(2);
		expect(result.current.temporaryMessages[room.id][`edited_${textMessage2.id}`]).toBe(
			textMessage2
		);
	});

	it('add one reference edited and on deleted', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addDeletedMessageRef(room.id, textMessage1));
		act(() => result.current.addEditedMessageRef(room.id, textMessage2));
		expect(result.current.temporaryMessages[room.id][`deleted_${textMessage1.id}`]).toBe(
			textMessage1
		);
		expect(result.current.temporaryMessages[room.id]).not.toBeNull();
		expect(size(result.current.temporaryMessages[room.id])).toBe(2);
		expect(result.current.temporaryMessages[room.id][`edited_${textMessage2.id}`]).toBe(
			textMessage2
		);
	});
});
