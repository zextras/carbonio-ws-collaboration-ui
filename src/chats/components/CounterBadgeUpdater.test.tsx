/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import * as Shell from '@zextras/carbonio-shell-ui';

import CounterBadgeUpdater from './CounterBadgeUpdater';
import useStore from '../../store/Store';
import { createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { RoomType } from '../../types/store/RoomTypes';

const singleRoom = createMockRoom({ id: 'single-id', type: RoomType.ONE_TO_ONE });
const groupRoom = createMockRoom({ id: 'group-id', type: RoomType.GROUP });
const temporaryRoom = createMockRoom({ id: 'temporary-id', type: RoomType.TEMPORARY });
const roomMuted = createMockRoom({
	id: 'muted-id',
	type: RoomType.GROUP,
	userSettings: { muted: true }
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([singleRoom, groupRoom, temporaryRoom, roomMuted]);
});

describe('CounterBadgeUpdater tests', () => {
	test('No conversations have unread messages', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('One-to-one conversation has unread messages', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().incrementUnreadCount(singleRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Group conversation has unread messages', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().incrementUnreadCount(groupRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Temporary conversation has unread messages and it is not shown', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().incrementUnreadCount(temporaryRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Muted conversation has unread messages and it is not shown', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().incrementUnreadCount(roomMuted.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Multiple conversations have unread messages', async () => {
		const updatePrimaryBadge = vi.spyOn(Shell, 'updatePrimaryBadge');
		const store = useStore.getState();
		store.incrementUnreadCount(singleRoom.id, 2);
		store.incrementUnreadCount(groupRoom.id, 3);
		store.incrementUnreadCount(temporaryRoom.id, 4);
		store.incrementUnreadCount(roomMuted.id, 5);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 5, showCount: true }, 'chats');
	});
});
