/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import CounterBadgeUpdater from './CounterBadgeUpdater';
import { updatePrimaryBadge } from '../../../__mocks__/@zextras/carbonio-shell-ui';
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
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('One-to-one conversation has unread messages', async () => {
		useStore.getState().addUnreadCount(singleRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Group conversation has unread messages', async () => {
		useStore.getState().addUnreadCount(groupRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 1, showCount: true }, 'chats');
	});

	test('Temporary conversation has unread messages and it is not shown', async () => {
		useStore.getState().addUnreadCount(temporaryRoom.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Muted conversation has unread messages and it is not shown', async () => {
		useStore.getState().addUnreadCount(roomMuted.id, 1);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: false, count: 0, showCount: true }, 'chats');
	});

	test('Multiple conversations have unread messages', async () => {
		useStore.getState().addUnreadCount(singleRoom.id, 2);
		useStore.getState().addUnreadCount(groupRoom.id, 3);
		useStore.getState().addUnreadCount(temporaryRoom.id, 4);
		useStore.getState().addUnreadCount(roomMuted.id, 5);
		setup(<CounterBadgeUpdater />);
		expect(updatePrimaryBadge).toBeCalledWith({ show: true, count: 5, showCount: true }, 'chats');
	});
});
