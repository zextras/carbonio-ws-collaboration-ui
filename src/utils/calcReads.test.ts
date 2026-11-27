/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { calcReads } from './calcReads';
import useStore from '../store/Store';
import { createMockMarker, createMockMember, createMockRoom } from '../tests/createMock';
import { MarkerStatus } from '../types/store/ChatsRegistryTypes';

const sessionId = 'sessionUserId';
const messageDate = 1000;

const room = createMockRoom({
	id: 'roomId',
	members: [
		createMockMember({ userId: sessionId }),
		createMockMember({ userId: 'user1' }),
		createMockMember({ userId: 'user2' })
	]
});

const markerOf = (userId: string): ReturnType<typeof createMockMarker> =>
	createMockMarker({ from: userId, messageId: 'unknown', markerDate: 2000 });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionId, name: 'session' });
	store.addRooms([room]);
});

describe('calcReads', () => {
	test('is UNREAD without markers', () => {
		expect(calcReads(messageDate, room.id, {})).toBe(MarkerStatus.UNREAD);
	});

	test('is READ when every current member has read it', () => {
		const markers = { user1: markerOf('user1'), user2: markerOf('user2') };
		expect(calcReads(messageDate, room.id, markers)).toBe(MarkerStatus.READ);
	});

	test('is READ_BY_SOMEONE when only some current members have read it', () => {
		const markers = { user1: markerOf('user1') };
		expect(calcReads(messageDate, room.id, markers)).toBe(MarkerStatus.READ_BY_SOMEONE);
	});

	test('ignores the marker of a former member', () => {
		const markers = { user1: markerOf('user1'), former: markerOf('former') };
		expect(calcReads(messageDate, room.id, markers)).toBe(MarkerStatus.READ_BY_SOMEONE);
	});

	test('is UNREAD when only a former member has read it', () => {
		const markers = { former: markerOf('former') };
		expect(calcReads(messageDate, room.id, markers)).toBe(MarkerStatus.UNREAD);
	});

	test('ignores the marker of the session user', () => {
		const markers = { [sessionId]: markerOf(sessionId) };
		expect(calcReads(messageDate, room.id, markers)).toBe(MarkerStatus.UNREAD);
	});
});
