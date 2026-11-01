/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { deserializeUnreadChatsConfig, unreadChatsWidget } from './unreadChatsDefinition';
import UnreadChatsWidget from './UnreadChatsWidget';
import UnreadChatsWidgetSettings from './UnreadChatsWidgetSettings';
import useStore from '../../store/Store';
import { createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { RoomType } from '../../types/network/models/roomBeTypes';

const FIRST_GROUP = 'First group';
const SECOND_GROUP = 'Second group';
const size = { columns: 4, rows: 5 };

const room1 = createMockRoom({ id: 'room1', name: FIRST_GROUP, type: RoomType.GROUP });
const room2 = createMockRoom({ id: 'room2', name: SECOND_GROUP, type: RoomType.GROUP });

describe('Unread chats widget', () => {
	beforeEach(() => {
		useStore.getState().addRooms([room1, room2]);
		useStore.getState().setUnreadCount('room1', 3);
	});

	test('shows a hint when no chat is selected', () => {
		setup(<UnreadChatsWidget config={{ roomIds: [] }} size={size} />);
		expect(
			screen.getByText('Choose the chats to show from the widget settings')
		).toBeInTheDocument();
	});

	test('shows the selected chats with their unread count', () => {
		setup(<UnreadChatsWidget config={{ roomIds: ['room1', 'room2'] }} size={size} />);
		expect(screen.getByText(FIRST_GROUP)).toBeVisible();
		expect(screen.getByText(SECOND_GROUP)).toBeVisible();
		expect(screen.getByText('3')).toBeVisible();
	});

	test('skips chats that no longer exist', () => {
		setup(<UnreadChatsWidget config={{ roomIds: ['room1', 'deleted'] }} size={size} />);
		expect(screen.getByText(FIRST_GROUP)).toBeVisible();
		expect(screen.queryByTestId('unread-chat-deleted')).not.toBeInTheDocument();
	});

	test('settings report the chats added to the selection', async () => {
		const onChange = vi.fn();
		const { user } = setup(
			<UnreadChatsWidgetSettings config={{ roomIds: ['room1'] }} onChange={onChange} />
		);
		await user.click(screen.getByText(SECOND_GROUP));
		expect(onChange).toHaveBeenCalledWith({ roomIds: ['room1', 'room2'] });
	});

	test('settings report the chats removed from the selection', async () => {
		const onChange = vi.fn();
		const { user } = setup(
			<UnreadChatsWidgetSettings config={{ roomIds: ['room1', 'room2'] }} onChange={onChange} />
		);
		await user.click(screen.getByText(FIRST_GROUP));
		expect(onChange).toHaveBeenCalledWith({ roomIds: ['room2'] });
	});

	test('serialization round trip and invalid input fallback', () => {
		const config = { roomIds: ['room1'] };
		expect(unreadChatsWidget.deserialize(unreadChatsWidget.serialize(config))).toEqual(config);
		expect(deserializeUnreadChatsConfig(undefined)).toEqual({ roomIds: [] });
		expect(deserializeUnreadChatsConfig({ v: 1, data: '{bad' })).toEqual({ roomIds: [] });
		expect(deserializeUnreadChatsConfig({ v: 1, data: '{"roomIds":[1]}' })).toEqual({
			roomIds: []
		});
	});
});
