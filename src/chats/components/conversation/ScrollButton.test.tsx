/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ScrollButton from './ScrollButton';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';

const room = createMockRoom();

describe('ScrollButton', () => {
	test('Display ScrollButton without unread message', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<ScrollButton roomId={room.id} onClickCb={jest.fn()} />);

		const scrollButton = screen.getByTestId('scrollButton');
		expect(scrollButton).toBeInTheDocument();
		const unreadCount = screen.queryByTestId('scrollButton-unreadCount');
		expect(unreadCount).toBeNull();
	});

	test('Display sScrollButton with 1 unread message', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.incrementUnreadCount(room.id);
		setup(<ScrollButton roomId={room.id} onClickCb={jest.fn()} />);

		const scrollButton = screen.getByTestId('scrollButton');
		expect(scrollButton).toBeInTheDocument();
		const badgeCount = await screen.findByText('1');
		expect(badgeCount).toBeInTheDocument();
	});
});
