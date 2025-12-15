/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom';

import RoomView from './RoomView';
import useStore from '../../store/Store';
import { createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';

const room = createMockRoom({ id: 'test-room-1' });

beforeEach(() => {
	useStore.getState().addRooms([room]);
});
describe('RoomView', () => {
	test('roomId param correspond to a room stored in the store', () => {
		const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ roomId: room.id });
		setup(<RoomView />);
		expect(screen.getByTestId(`ConversationWrapper-${room.id}`)).toBeInTheDocument();
	});

	test('roomId param does not correspond to any stored room', () => {
		const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ roomId: 'roomId' });
		setup(<RoomView />);
		expect(screen.queryByTestId('ConversationWrapper-roomId')).not.toBeInTheDocument();
	});

	test('roomId param is not setted', () => {
		const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ roomId: undefined });
		setup(<RoomView />);
		expect(screen.queryByTestId('ConversationWrapper-roomId')).not.toBeInTheDocument();
	});

	test('roomId param is set as selectedRoomId', () => {
		const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ roomId: room.id });
		setup(<RoomView />);
		expect(useStore.getState().session.selectedRoom).toBe(room.id);
	});
});
