/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../store/Store';
import { createMockRoom } from '../tests/createMock';
import { RoomBe } from '../types/network/models/roomBeTypes';
import GroupAvatar from './GroupAvatar';

const members = [
	{
		userId: 'user1',
		owner: true,
		temporary: false,
		external: false
	},
	{
		userId: 'user2',
		owner: false,
		temporary: false,
		external: false
	}
];

const roomId = 'Group-Room-Id';
const room: RoomBe = createMockRoom({ members, id: roomId });
const roomMuted: RoomBe = createMockRoom({
	members,
	id: roomId,
	userSettings: { muted: true }
});

describe('Group avatar', () => {
	test('Check if group notifications are disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId('icon: BellOff');
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('Check if group notifications are enabled', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<GroupAvatar roomId={roomId} draftMessage={false} />);
		const avatarWithNotificationMuted = screen.getByTestId(`${room.name}-avatar`);
		expect(avatarWithNotificationMuted).toBeVisible();
	});
	test('Check if there is the draft message and notifications enabled', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.setDraftMessage(roomId, false, 'hi everyone!');
		setup(<GroupAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
	test('Check if there is the draft message and notifications disabled', async () => {
		const store = useStore.getState();
		store.addRoom(roomMuted);
		store.setDraftMessage(roomId, false, 'hi everyone!');
		setup(<GroupAvatar roomId={roomId} draftMessage />);
		const userAvatarWithDraft = screen.getByTestId('icon: Edit2');
		expect(userAvatarWithDraft).toBeVisible();
	});
});
