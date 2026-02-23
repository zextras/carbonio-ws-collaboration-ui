/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MuteConversationAction from './MuteConversationAction';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test-2',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: true }
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([testRoom, testRoom2]);
});
describe('Mute/Unmute Conversation', () => {
	test('Label should be "Mute notifications" in groups', async () => {
		setup(<MuteConversationAction roomId={testRoom.id} />);
		const titleIsPresent = screen.getByText(/Mute notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});

	test('Label should be "Activate notifications" in groups', async () => {
		setup(<MuteConversationAction roomId={testRoom2.id} />);
		const titleIsPresent = screen.getByText(/Activate notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});

	test('mute notifications', async () => {
		const spyOnMuteRoomNotification = vi.spyOn(roomsApi, 'muteRoomNotification');
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);

		const muteAction = await screen.findByText(/Mute notifications/i);
		await user.click(muteAction);
		expect(muteAction).toBeInTheDocument();

		await user.click(muteAction);
		expect(spyOnMuteRoomNotification).toHaveBeenCalled();
	});

	test('unmute notifications', async () => {
		const spyOnUnmuteRoomNotification = vi.spyOn(roomsApi, 'unmuteRoomNotification');
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);

		const unmuteAction = screen.getByText(/Activate notifications/i);
		await user.click(unmuteAction);
		expect(unmuteAction).toBeInTheDocument();

		await user.click(unmuteAction);
		expect(spyOnUnmuteRoomNotification).toHaveBeenCalled();
	});

	test('undo mute', async () => {
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);

		const mute = screen.getByText(/Mute notifications/i);
		expect(mute).toBeEnabled();

		await user.click(mute);

		const snackbar = await screen.findByText(/Notifications muted for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(useStore.getState().rooms[testRoom.id].userSettings?.muted).toBe(false);
	});

	test('undo unmute', async () => {
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);

		const unmuteAction = screen.getByText(/Activate notifications/i);
		await user.click(unmuteAction);
		const snackbar = await screen.findByText(/Notifications activated for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(useStore.getState().rooms[testRoom2.id].userSettings?.muted).toBe(true);
	});
});
