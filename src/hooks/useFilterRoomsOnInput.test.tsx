/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import { useFilterRoomsOnInput } from './useFilterRoomsOnInput';
import useStore from '../store/Store';
import { createMockRoom, createMockUser } from '../tests/createMock';
import { RoomType } from '../types/store/RoomTypes';

const user1 = createMockUser({ id: 'userId1', name: 'User 1' });
const user2 = createMockUser({ id: 'userId2', name: 'User 2' });
const user3 = createMockUser({ id: 'userId3', name: 'User 3' });

const group1 = createMockRoom({ id: 'roomId1', name: 'Room 1' });
const group2 = createMockRoom({ id: 'roomId2', name: 'Room 2' });
const group3 = createMockRoom({ id: 'roomId3', name: 'Room 3' });

const single1 = createMockRoom({
	id: 'roomId4',
	members: [{ userId: user1.id }],
	type: RoomType.ONE_TO_ONE
});
const single2 = createMockRoom({
	id: 'roomId5',
	members: [{ userId: user2.id }],
	type: RoomType.ONE_TO_ONE
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('sessionId', 'User Name');
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
});
describe('Test useFilterRoomsOnInput custom hook', () => {
	test('Rooms list is empty with no filters', () => {
		const { result } = renderHook(() => useFilterRoomsOnInput(''));
		expect(result.current).toEqual([]);
	});

	test('Rooms list contains all rooms if there is no text filter', () => {
		const store = useStore.getState();
		store.setRooms([group1, group2, group3, single1, single2]);
		const { result } = renderHook(() => useFilterRoomsOnInput(''));
		expect(result.current.length).toEqual(5);
	});

	test('Rooms list contains 1to1 that have the filter in the other member name', () => {
		const store = useStore.getState();
		store.setRooms([single1, single2]);
		const { result } = renderHook(() => useFilterRoomsOnInput('User 1'));
		expect(result.current.length).toEqual(1);
		expect(result.current[0].roomId).toEqual(single1.id);
	});

	test('Rooms list contains groups that have the filter in the name', () => {
		const store = useStore.getState();
		store.setRooms([group1, group2, group3]);
		const { result } = renderHook(() => useFilterRoomsOnInput('Room 1'));
		expect(result.current.length).toEqual(1);
		expect(result.current[0].roomId).toEqual(group1.id);
	});

	test('Rooms list contains groups that have the filter in the member name', () => {
		const store = useStore.getState();
		store.setRooms([
			{
				...group1,
				members: [
					{ userId: user1.id, owner: false },
					{ userId: user2.id, owner: false }
				]
			},
			{
				...group2,
				members: [
					{ userId: user1.id, owner: false },
					{ userId: user3.id, owner: false }
				]
			},
			{ ...group3, members: [{ userId: user3.id, owner: false }] }
		]);
		const { result } = renderHook(() => useFilterRoomsOnInput('User 2'));
		expect(result.current.length).toEqual(1);
		expect(result.current[0].roomId).toEqual(group1.id);
	});
});
