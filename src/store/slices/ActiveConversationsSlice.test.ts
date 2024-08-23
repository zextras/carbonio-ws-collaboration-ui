/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMockMember, createMockRoom, createMockTextMessage } from '../../tests/createMock';
import useStore from '../Store';

const mockedRoom = createMockRoom();

const mockedUser0 = createMockMember({ userId: 'user0' });
const mockedUser1 = createMockMember({ userId: 'user1' });

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(mockedRoom);
	store.addRoomMember(mockedRoom.id, mockedUser0);
	store.addRoomMember(mockedRoom.id, mockedUser1);
});

describe('Active conversations slice', () => {
	test('User starts to write', () => {
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		const writingList = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
		expect(writingList?.length).toBe(1);
		expect(writingList?.[0]).toBe(mockedUser0.userId);

		// User stops and start to write again
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser1.userId, false);
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		const writingList2 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
		expect(writingList2?.length).toBe(1);
		expect(writingList2?.[0]).toBe(mockedUser0.userId);
	});

	test('More that one user start to write', () => {
		// Two users start to write
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser1.userId, true);
		const writingList = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
		expect(writingList?.length).toBe(2);

		// User0 stops and start to write again
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
		const writingList2 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
		expect(writingList2?.length).toBe(1);

		// User0 starts to write again
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		const writingList3 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
		expect(writingList3?.length).toBe(2);
	});

	test('User continue to write', () => {
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		setTimeout(() => {
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			expect(useStore.getState().activeConversations[mockedRoom.id].isWritingList?.length).toBe(1);
		}, 1000);
	});

	test('Receive a stop after user stopped to write', () => {
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
		useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
		expect(useStore.getState().activeConversations[mockedRoom.id].isWritingList?.length).toBe(0);
	});

	test('Set last received MAM message when it is the first message', () => {
		const message = createMockTextMessage({
			id: 'message0',
			roomId: mockedRoom.id,
			date: new Date('2022-01-01T00:00:00Z')
		});
		useStore.getState().setLastMamMessage(message);
		expect(useStore.getState().activeConversations[mockedRoom.id].lastMamMessage).toBe(message);
	});

	test('Replace last received MAM message', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			roomId: mockedRoom.id,
			date: new Date('2022-01-01T10:00:00Z')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			roomId: mockedRoom.id,
			date: new Date('2022-01-01T11:00:01Z')
		});
		useStore.getState().setLastMamMessage(message1);
		useStore.getState().setLastMamMessage(message0);
		expect(useStore.getState().activeConversations[mockedRoom.id].lastMamMessage).toStrictEqual(
			message0
		);
	});

	test('Last received MAM message is not replaced when it is older', () => {
		const message0 = createMockTextMessage({
			id: 'message0',
			roomId: mockedRoom.id,
			date: new Date('2022-01-01T10:00:00Z')
		});
		const message1 = createMockTextMessage({
			id: 'message1',
			roomId: mockedRoom.id,
			date: new Date('2022-01-02T10:00:01Z')
		});
		useStore.getState().setLastMamMessage(message0);
		useStore.getState().setLastMamMessage(message1);
		expect(useStore.getState().activeConversations[mockedRoom.id].lastMamMessage).toStrictEqual(
			message0
		);
	});
});
