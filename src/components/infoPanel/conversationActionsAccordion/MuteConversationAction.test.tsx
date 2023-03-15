/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
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

		const muteAction = screen.getByText(/Mute notifications/i);
		await user.click(muteAction);
		expect(muteAction).toBeInTheDocument();

		await user.click(muteAction);
		const snackbar = await screen.findByText(/Notifications muted for this chat/i);
		expect(snackbar).toBeVisible();
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(true);
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
		const snackbar = await screen.findByText(/Notifications activated for this chat/i);
		expect(snackbar).toBeVisible();
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(false);
	});
	test('undo mute rejected', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom));
		mockedMuteRoomNotificationRequest.mockReturnValue(true);
		mockedUnmuteRoomNotificationRequest.mockRejectedValueOnce(false);
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);

		const muteAction = screen.getByText(/Mute notifications/i);
		await user.click(muteAction);
		const snackbar = await screen.findByText(/Notifications muted for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(true);
	});
	test('undo mute', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom));
		mockedMuteRoomNotificationRequest.mockReturnValue(true);
		mockedUnmuteRoomNotificationRequest.mockReturnValueOnce(true);
		const { user } = setup(<MuteConversationAction roomId={testRoom.id} />);

		const muteAction = screen.getByText(/Mute notifications/i);
		await user.click(muteAction);
		const snackbar = await screen.findByText(/Notifications muted for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(false);
	});
	test('undo unmute rejected', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom2));
		mockedUnmuteRoomNotificationRequest.mockReturnValue(true);
		mockedMuteRoomNotificationRequest.mockRejectedValueOnce(false);
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);

		const unmuteAction = screen.getByText(/Activate notifications/i);
		await user.click(unmuteAction);
		const snackbar = await screen.findByText(/Notifications activated for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(false);
	});
	test('undo unmute', async () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(testRoom2));
		mockedUnmuteRoomNotificationRequest.mockReturnValue(true);
		mockedMuteRoomNotificationRequest.mockReturnValueOnce(true);
		const { user } = setup(<MuteConversationAction roomId={testRoom2.id} />);

		const unmuteAction = screen.getByText(/Activate notifications/i);
		await user.click(unmuteAction);
		const snackbar = await screen.findByText(/Notifications activated for this chat/i);
		expect(snackbar).toBeVisible();
		await user.click(screen.getByText(/UNDO/i));
		expect(result.current.rooms[testRoom.id].userSettings?.muted).toBe(true);
	});
});
