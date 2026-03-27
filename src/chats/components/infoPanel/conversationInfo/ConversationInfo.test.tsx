/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ConversationInfo from './ConversationInfo';
import ConversationInfoDetails from './ConversationInfoDetails';
import { mockUseMediaQueryCheck } from '../../../../hooks/__mocks__/useMediaQueryCheck';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';

const user1Be: UserBe = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const room: RoomBe = createMockRoom({
	id: 'Room-Id',
	name: 'Room Name',
	description: 'This is the description of the group',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: 'user2' }),
		createMockMember({ userId: 'user3' })
	]
});

const oneToOneRoom: RoomBe = createMockRoom({
	id: 'One-To-One-Room-Id',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id, owner: true })]
});

vi.mock('../../../../hooks/useMediaQueryCheck');

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo([user1Be]);
	store.addRooms([room, oneToOneRoom]);
});

describe('Conversation info Details', () => {
	test('group info should appear as expected', async () => {
		setup(<ConversationInfoDetails roomId={room.id} roomType="group" />);
		expect(screen.getByText(room.description!)).toBeInTheDocument();
		act(() => useStore.getState().editRoom(room.id, { description: 'new description' }));
		expect(screen.getByText(/new description/i)).toBeInTheDocument();
	});

	test('user info should appear as expected', async () => {
		setup(<ConversationInfoDetails roomId={oneToOneRoom.id} roomType={RoomType.ONE_TO_ONE} />);
		expect(screen.getAllByText(user1Be.name)).toHaveLength(1);
		expect(screen.getByText(user1Be.email)).toBeInTheDocument();
	});
});

describe('Conversation Info', () => {
	test('user info should appear as expected', async () => {
		setup(
			<ConversationInfo
				roomId={oneToOneRoom.id}
				roomType={RoomType.ONE_TO_ONE}
				goToChatView={vi.fn()}
			/>
		);
		expect(screen.getAllByText(user1Be.name)).toHaveLength(1);
	});

	test('group info should appear as expected', async () => {
		setup(<ConversationInfo roomId={room.id} roomType={RoomType.GROUP} goToChatView={vi.fn()} />);
		expect(screen.getByText(room.name!)).toBeInTheDocument();
	});

	test('infoPanel take all space', async () => {
		setup(<ConversationInfo roomId={room.id} roomType={RoomType.GROUP} goToChatView={vi.fn()} />);
		const messagesIcon = screen.getByTestId('icon: MessageCircleOutline');
		expect(messagesIcon).toBeInTheDocument();
	});

	test('infoPanel does not take all space', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		setup(<ConversationInfo roomId={room.id} roomType={RoomType.GROUP} goToChatView={vi.fn()} />);
		expect(screen.queryByTestId('icon: MessageCircleOutline')).toBeNull();
	});
});
