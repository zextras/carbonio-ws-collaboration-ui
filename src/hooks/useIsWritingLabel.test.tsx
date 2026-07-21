/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';

import { useIsWritingLabel } from './useIsWritingLabel';
import useStore from '../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../tests/createMock';

vi.mock('react-i18next');

const user1Info = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'One'
});

const user2Info = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'Two'
});

const user3Info = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'Three'
});

const user4Info = createMockUser({
	id: 'user4',
	email: 'user4@domain.com',
	name: 'Four'
});

const user5Info = createMockUser({
	id: 'user5',
	email: 'user5@domain.com',
	name: 'User 5'
});

const testRoom = createMockRoom({
	id: 'room-test',
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user2Info.id }),
		createMockMember({ userId: user3Info.id }),
		createMockMember({ userId: user4Info.id }),
		createMockMember({ userId: user5Info.id })
	]
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([testRoom]);
});

describe('useIsWritingLabel', () => {
	test('one user is writing', () => {
		const store = useStore.getState();
		store.setIsWriting(testRoom.id, user1Info.id, true);

		const { result } = renderHook(() => useIsWritingLabel(testRoom.id));

		expect(result.current).toBe(' status.isTyping');
	});
	test('two users are writing', () => {
		const store = useStore.getState();
		store.setIsWriting(testRoom.id, user1Info.id, true);
		store.setIsWriting(testRoom.id, user2Info.id, true);

		const { result } = renderHook(() => useIsWritingLabel(testRoom.id));

		expect(result.current).toBe(',  status.areTyping');
	});
	test('four users are writing', () => {
		const store = useStore.getState();
		store.setIsWriting(testRoom.id, user1Info.id, true);
		store.setIsWriting(testRoom.id, user2Info.id, true);
		store.setIsWriting(testRoom.id, user3Info.id, true);
		store.setIsWriting(testRoom.id, user4Info.id, true);

		const { result } = renderHook(() => useIsWritingLabel(testRoom.id));

		expect(result.current).toBe('status.nameAndNumberOfPeopleAreTyping');
	});
	test('one user is writing - meeting view', () => {
		const store = useStore.getState();
		store.setIsWriting(testRoom.id, user1Info.id, true);

		const { result } = renderHook(() => useIsWritingLabel(testRoom.id, true));

		expect(result.current).toBe(' status.isTyping');
	});
	test('more users are writing - meeting view', () => {
		const store = useStore.getState();
		store.setIsWriting(testRoom.id, user1Info.id, true);
		store.setIsWriting(testRoom.id, user2Info.id, true);
		store.setIsWriting(testRoom.id, user3Info.id, true);
		store.setIsWriting(testRoom.id, user4Info.id, true);

		const { result } = renderHook(() => useIsWritingLabel(testRoom.id, true));

		expect(result.current).toBe('status.numberOfPeopleAreTyping');
	});
});
