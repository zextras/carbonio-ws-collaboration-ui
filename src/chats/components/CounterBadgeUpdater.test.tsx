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
	store.addRoom(singleRoom);
	store.addRoom(groupRoom);
	store.addRoom(temporaryRoom);
	store.addRoom(roomMuted);
});

describe('CounterBadgeUpdater tests', () => {
	test('No conversations have unread messages', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('One-to-one conversation has unread messages', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().addUnreadCount(singleRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Group conversation has unread messages', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().addUnreadCount(groupRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Temporary conversation has unread messages and it is not shown', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().addUnreadCount(temporaryRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Muted conversation has unread messages and it is not shown', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		useStore.getState().addUnreadCount(roomMuted.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Multiple conversations have unread messages', async () => {
		const updatePrimaryBadge = jest.spyOn(Shell, 'updatePrimaryBadge');
		const store = useStore.getState();
		store.addUnreadCount(singleRoom.id, 2);
		store.addUnreadCount(groupRoom.id, 3);
		store.addUnreadCount(temporaryRoom.id, 4);
		store.addUnreadCount(roomMuted.id, 5);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 5, showCount: true }, 'chats');
	});
});
