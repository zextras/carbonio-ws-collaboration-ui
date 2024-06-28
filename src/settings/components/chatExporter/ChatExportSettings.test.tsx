/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ChatExportSettings from './ChatExportSettings';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';

const room = createMockRoom({
	id: 'room',
	name: 'Room'
});
const room1 = createMockRoom({
	id: 'room1',
	name: 'Room 1'
});
const room2 = createMockRoom({
	id: 'room2',
	name: 'Room 12'
});
const room3 = createMockRoom({
	id: 'room3',
	name: 'Room 123'
});

const filterList = 'Filter list';

describe('ChatExportSettings test', () => {
	test('There are no rooms', () => {
		setup(<ChatExportSettings />);
		expect(screen.getByText('There’s nothing there.')).toBeInTheDocument();
	});

	test('All rooms are listed', () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		setup(<ChatExportSettings />);
		expect(screen.getByText('Room')).toBeInTheDocument();
		expect(screen.getByText('Room 1')).toBeInTheDocument();
		expect(screen.getByText('Room 12')).toBeInTheDocument();
		expect(screen.getByText('Room 123')).toBeInTheDocument();
	});

	test('Display only filtered rooms', async () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		const { user } = setup(<ChatExportSettings />);
		const input = screen.getByPlaceholderText(filterList);
		await user.type(input, '12');
		expect(screen.queryByText('Room')).not.toBeInTheDocument();
		expect(screen.queryByText('Room 1')).not.toBeInTheDocument();
		expect(screen.getByText('Room 12')).toBeInTheDocument();
		expect(screen.getByText('Room 123')).toBeInTheDocument();
	});

	test('Select chat to export by clicking on it', async () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		const { user } = setup(<ChatExportSettings />);
		await user.click(screen.getByText(room.name!));
		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	test('Deselect chat when user starts typing', async () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		const { user } = setup(<ChatExportSettings />);
		await user.click(screen.getByText(room.name!));
		const input = screen.getByPlaceholderText(filterList);
		await user.type(input, '12');
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	test('No filtered chat', async () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		const { user } = setup(<ChatExportSettings />);
		const input = screen.getByPlaceholderText(filterList);
		await user.type(input, 'Test test test');
		expect(screen.getByText('Try another query')).toBeInTheDocument();
	});

	test('Export chat', async () => {
		useStore.getState().setRooms([room, room1, room2, room3]);
		const { user } = setup(<ChatExportSettings />);
		await user.click(screen.getByText(room.name!));
		const button = screen.getByRole('button');
		await user.click(button);
		expect(useStore.getState().session.chatExporting!.roomId).toBe(room.id);
	});
});
