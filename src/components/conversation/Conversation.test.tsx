/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import { mockUseMediaQueryCheck } from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { User } from '../../types/store/UserTypes';
import Conversation from './Conversation';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'Name of the group',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'user1' }), createMockMember({ userId: 'user2' })],
	userSettings: { muted: false }
});

const user1Info: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
};

const user2Info: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
};

describe('Conversation view', () => {
	test('Display conversation view on small screen and toggle info panel', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		const { user } = setup(<Conversation room={testRoom} />);
		const conversationCollapsedView = screen.getByTestId('conversationCollapsedView');
		expect(conversationCollapsedView).toBeInTheDocument();
		const infoPanelToggle = screen.getByTestId('infoPanelToggle');
		expect(infoPanelToggle).toBeInTheDocument();
		await user.click(infoPanelToggle);
		const conversationInfoPanelOpen = screen.getByTestId('conversationInfoPanelOpen');
		expect(conversationInfoPanelOpen).toBeInTheDocument();
		const closeInfoPanel = screen.getByTestId('closeInfoPanel');
		expect(closeInfoPanel).toBeInTheDocument();
		await user.click(closeInfoPanel);
		const infoPanelToggleVisibleAgain = screen.getByTestId('infoPanelToggle');
		expect(infoPanelToggleVisibleAgain).toBeInTheDocument();
	});
	test('Display info panel and check data are visible', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		const { user } = setup(<Conversation room={testRoom} />);
		const conversationCollapsedView = screen.getByTestId('conversationCollapsedView');
		expect(conversationCollapsedView).toBeInTheDocument();
		const infoPanelToggle = screen.getByTestId('infoPanelToggle');
		expect(infoPanelToggle).toBeInTheDocument();
		await user.click(infoPanelToggle);
		const conversationInfoPanelOpen = screen.getByTestId('conversationInfoPanelOpen');
		expect(conversationInfoPanelOpen).toBeInTheDocument();
		const userName = screen.getByText(/User 2/i);
		expect(userName).toBeInTheDocument();
		const roomName = screen.getByText(/Name of the group/i);
		expect(roomName).toBeInTheDocument();
		const roomDescription = screen.getByText(/A description/i);
		expect(roomDescription).toBeInTheDocument();
	});
});
