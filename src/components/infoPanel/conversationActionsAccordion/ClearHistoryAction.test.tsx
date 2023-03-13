/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import { mockedClearHistoryRequest } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomType } from '../../../types/network/models/roomBeTypes';
import { User } from '../../../types/store/UserTypes';
import ClearHistoryAction from './ClearHistoryAction';

const user1Info: User = {
	id: 'user1-id',
	email: 'user1@domain.com',
	name: 'User 1'
};

const user2Info: User = {
	id: 'user2-id',
	email: 'user2@domain.com',
	name: 'User 2'
};

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
		const store = useStore.getState();
		store.addRoom(mockedRoom);
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.newMessage(message);

		mockedClearHistoryRequest.mockReturnValueOnce({
			clearedAt: '2022-10-31T10:39:48.622581+01:00'
		});
		const { user } = setup(<ClearHistoryAction roomId={mockedRoom.id} />);
		const clearHistoryLabel = screen.getByText(/Clear History/i);

		await user.click(clearHistoryLabel);

		// the third one is the button one
		expect(screen.getAllByText(/Clear History/i)).toHaveLength(3);

		await user.click(screen.getAllByText(/Clear History/i)[2]);

		// the modal has disappeared
		expect(screen.getAllByText(/Clear History/i)).toHaveLength(1);
	});
});
