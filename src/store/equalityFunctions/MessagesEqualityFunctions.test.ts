/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { roomsListSecondaryBarLengthEqualityFn } from './MessagesEqualityFunctions';

const initialStore = [
	{ roomId: '111111111111', lastMessageTimestamp: 111111111111 },
	{ roomId: '222222222222', lastMessageTimestamp: 222222222222 },
	{ roomId: '333333333333', lastMessageTimestamp: 333333333333 },
	{ roomId: '444444444444', lastMessageTimestamp: 444444444444 },
	{ roomId: '555555555555', lastMessageTimestamp: 555555555555 }
];

const storeWithNewTimestamp = [
	{ roomId: '111111111111', lastMessageTimestamp: 111111111111 },
	{ roomId: '222222222222', lastMessageTimestamp: 555555555555 },
	{ roomId: '333333333333', lastMessageTimestamp: 333333333333 },
	{ roomId: '444444444444', lastMessageTimestamp: 444444444444 },
	{ roomId: '555555555555', lastMessageTimestamp: 555555555555 }
];

const storeWithNewRoomId = [
	{ roomId: '111111111111', lastMessageTimestamp: 111111111111 },
	{ roomId: '222222222222', lastMessageTimestamp: 222222222222 },
	{ roomId: '333333333333', lastMessageTimestamp: 333333333333 },
	{ roomId: '888888888888', lastMessageTimestamp: 444444444444 },
	{ roomId: '555555555555', lastMessageTimestamp: 555555555555 }
];

const storeWithNewRoom = [
	{ roomId: '111111111111', lastMessageTimestamp: 111111111111 },
	{ roomId: '222222222222', lastMessageTimestamp: 222222222222 },
	{ roomId: '333333333333', lastMessageTimestamp: 333333333333 },
	{ roomId: '444444444444', lastMessageTimestamp: 444444444444 },
	{ roomId: '555555555555', lastMessageTimestamp: 555555555555 },
	{ roomId: '666666666666', lastMessageTimestamp: 666666666666 }
];

const storeNewRoomSameLength = [
	{ roomId: '111111111111', lastMessageTimestamp: 111111111111 },
	{ roomId: '222222222222', lastMessageTimestamp: 222222222222 },
	{ roomId: '333333333333', lastMessageTimestamp: 333333333333 },
	{ roomId: '666666666666', lastMessageTimestamp: 666666666666 },
	{ roomId: '555555555555', lastMessageTimestamp: 555555555555 }
];

describe('Test MessagesSlice equality functions', () => {
	it('Test roomsListSecondaryBarLengthEqualityFn with same store', () => {
		expect(roomsListSecondaryBarLengthEqualityFn(initialStore, initialStore)).toBeTruthy();
	});

	it('Test roomsListSecondaryBarLengthEqualityFn with new timestamp', () => {
		expect(roomsListSecondaryBarLengthEqualityFn(initialStore, storeWithNewTimestamp)).toBeFalsy();
	});

	it('Test roomsListSecondaryBarLengthEqualityFn with new roomId', () => {
		expect(roomsListSecondaryBarLengthEqualityFn(initialStore, storeWithNewRoomId)).toBeFalsy();
	});

	it('Test roomsListSecondaryBarLengthEqualityFn with new room object', () => {
		expect(roomsListSecondaryBarLengthEqualityFn(initialStore, storeWithNewRoom)).toBeFalsy();
	});

	it('Test roomsListSecondaryBarLengthEqualityFn with new room object but same length', () => {
		expect(roomsListSecondaryBarLengthEqualityFn(initialStore, storeNewRoomSameLength)).toBeFalsy();
	});
});
