/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act, renderHook } from '@testing-library/react';

import MuteConversationAction from './MuteConversationAction';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import {
	mockedMuteRoomNotificationRequest,
	mockedUnmuteRoomNotificationRequest
} from '../../../../tests/mocks/network';
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
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: true }
});

describe('Mute/Unmute Conversation', () => {
	test('Label should be "Mute notifications" in groups', async () => {
		useStore.getState().addRoom(testRoom);
		setup(<MuteConversationAction roomId={testRoom.id} />);
		const titleIsPresent = screen.getByText(/Mute notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});
	test('Label should be "Activate notifications" in groups', async () => {
		useStore.getState().addRoom(testRoom2);
		setup(<MuteConversationAction roomId={testRoom2.id} />);
		const titleIsPresent = screen.getByText(/Activate notifications/i);
		expect(titleIsPresent).toBeInTheDocument();
	});
	test('mute notifications', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom));
		mockedMuteRoomNotificationRequest.mockRejectedValueOnce(false).mockReturnValueOnce(true);
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);

		const muteAction = await screen.findByText(/Mute notifications/i);
		await user.click(muteAction);
		expect(muteAction).toBeInTheDocument();

		await user.click(muteAction);
		expect(mockedMuteRoomNotificationRequest).toHaveBeenCalled();
	});
	test('unmute notifications', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom2));
		mockedUnmuteRoomNotificationRequest.mockRejectedValueOnce(false).mockReturnValueOnce(true);
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);

		const unmuteAction = screen.getByText(/Activate notifications/i);
		await user.click(unmuteAction);
		expect(unmuteAction).toBeInTheDocument();

		await user.click(unmuteAction);
		expect(mockedUnmuteRoomNotificationRequest).toHaveBeenCalled();
	});
	// TODO fix test
	// test('undo mute', async () => {
	// 	mockedMuteRoomNotificationRequest.mockReturnValue(true);
	// 	mockedUnmuteRoomNotificationRequest.mockReturnValueOnce(true);
	//
	// 	const { result } = renderHook(() => useStore());
	// 	act(() => result.current.addRoom(testRoom));
	// 	const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);
	//
	// 	const mute = screen.getByText(/Mute notifications/i);
	// 	expect(mute).toBeEnabled();
	//
	// 	await user.click(mute);
	//
	// 	const snackbar = await screen.findByText(/Notifications muted for this chat/i);
	// 	await waitFor(() => expect(snackbar).toBeVisible());
	// 	await user.click(screen.getByText(/UNDO/i));
	// 	await waitFor(() => expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(false));
	// });
	//
	// test('undo unmute', async () => {
	// 	const { result } = renderHook(() => useStore());
	// 	act(() => result.current.addRoom(testRoom2));
	// 	mockedUnmuteRoomNotificationRequest.mockReturnValue(true);
	// 	mockedMuteRoomNotificationRequest.mockReturnValueOnce(true);
	// 	const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);
	//
	// 	const unmuteAction = screen.getByText(/Activate notifications/i);
	// 	await user.click(unmuteAction);
	// 	const snackbar = await screen.findByText(/Notifications activated for this chat/i);
	// 	expect(snackbar).toBeVisible();
	// 	await user.click(screen.getByText(/UNDO/i));
	// 	await waitFor(() => expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(true));
	// });
});
