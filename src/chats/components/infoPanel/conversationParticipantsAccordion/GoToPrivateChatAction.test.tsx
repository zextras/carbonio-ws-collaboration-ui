/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import GoToPrivateChatAction from './GoToPrivateChatAction';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../../tests/createMock';
import { mockGoToRoomPage } from '../../../../tests/mocks/useRouting';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1-Id' });

const room = createMockRoom({
	id: 'room-Id',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id })]
});

describe('GoToPrivateChatAction tests', () => {
	test('IconButton is smaller if it is mount on the chat page', async () => {
		setup(<GoToPrivateChatAction memberId="memberId" />);
		const button1 = screen.getByRole('button');
		expect(button1).toHaveStyle('padding: 0.75rem');
	});

	test('IconButton is bigger if it is mount on the meeting page', async () => {
		setup(<GoToPrivateChatAction memberId="memberId" isParticipantMeeting />);
		const button2 = screen.getByRole('button');
		expect(button2).toHaveStyle('padding: 0.438rem');
	});

	test('User click the "Go to private chat" and chat does not exist', async () => {
		const { user } = setup(<GoToPrivateChatAction memberId={user1.id} />);
		const button = screen.getByRole('button');
		await user.click(button);

		const placeholderRoom = useStore.getState().rooms[`placeholder-${user1.id}`];
		expect(placeholderRoom).toEqual(
			expect.objectContaining({
				id: `placeholder-${user1.id}`,
				type: RoomType.ONE_TO_ONE,
				placeholder: true
			})
		);
	});

	test('User click the "Go to private chat" and chat already exists', async () => {
		useStore.getState().addRoom(room);
		const { user } = setup(<GoToPrivateChatAction memberId={user1.id} />);
		const button = screen.getByRole('button');
		await user.click(button);

		expect(mockGoToRoomPage).toHaveBeenCalledWith(room.id);
	});
});
