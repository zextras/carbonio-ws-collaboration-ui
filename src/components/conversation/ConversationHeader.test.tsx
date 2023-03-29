/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import ConversationHeader from './ConversationHeader';
import { mockUseMediaQueryCheck } from '../../../jest-mocks';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { RoomType } from '../../types/store/RoomTypes';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	name: 'name',
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

describe('Conversation header test', () => {
	test('Width of the screen is smaller than 1024 px', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(false);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		const infoIcon = screen.getByTestId('icon: InfoOutline');
		expect(infoIcon).toBeInTheDocument();
	});
	test('Width of the screen is bigger than 1024 px', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		setup(<ConversationHeader roomId={mockedRoom.id} setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('icon: InfoOutline')).toBeNull();
	});
});
