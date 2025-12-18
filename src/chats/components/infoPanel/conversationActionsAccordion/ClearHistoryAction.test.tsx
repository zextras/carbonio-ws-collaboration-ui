/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook, screen } from '@testing-library/react';

import ClearHistoryAction from './ClearHistoryAction';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

const mockedRoom = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Info.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
});

const message = createMockTextMessage({ roomId: mockedRoom.id });

describe('clear history action', () => {
	test('clear history', async () => {
		const spyOnClearRoomHistory = vi.spyOn(roomsApi, 'clearRoomHistory');
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRooms([mockedRoom]);
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo([user1Info, user2Info]);
			result.current.newMessage(message);
		});

		const { user } = setup(<ClearHistoryAction roomId={mockedRoom.id} />);
		const clearHistoryLabel = screen.getByText(/Clear History/i);

		await user.click(clearHistoryLabel);

		// the third one is the button one
		expect(screen.getAllByText(/Clear History/i)).toHaveLength(3);

		await user.click(screen.getAllByText(/Clear History/i)[2]);

		// the modal has disappeared
		expect(screen.getAllByText(/Clear History/i)).toHaveLength(1);
		expect(spyOnClearRoomHistory).toHaveBeenCalled();
	});
});
