/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import {
	mockedMuteRoomNotificationRequest,
	mockedUnmuteRoomNotificationRequest
} from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import MuteConversationAction from './MuteConversationAction';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: true }
});

describe('Mute/Unmute Conversation', () => {
	test('Label should be "Mute notifications" in groups', async () => {
		mockedMuteRoomNotificationRequest.mockReturnValueOnce(true);
		useStore.getState().addRoom(testRoom);
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);
		await user.click(screen.getByTestId('action'));
		const titleIsPresent = screen.getByText(/Mute notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});
	test('Label should be "Activate notifications" in groups', async () => {
		mockedUnmuteRoomNotificationRequest.mockReturnValueOnce(false);
		useStore.getState().addRoom(testRoom2);
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);
		await user.click(screen.getByTestId('action'));
		const titleIsPresent = screen.getByText(/Activate notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});
});
