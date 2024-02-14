/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import Conversation from './Conversation';
import { mockDarkReaderIsEnabled } from '../../../../__mocks__/darkreader';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { mockedDeleteRoomMemberRequest } from '../../../tests/mocks/network';
import { mockUseMediaQueryCheck } from '../../../tests/mocks/useMediaQueryCheck';
import { mockGoToMainPage } from '../../../tests/mocks/useRouting';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { User } from '../../../types/store/UserTypes';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'Name of the group',
	description: 'A description',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1' }),
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test-two',
	name: 'Another group',
	description: 'A description',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2' })
	],
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
		const { user } = setup(<Conversation roomId={testRoom.id} />);
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
		const { user } = setup(<Conversation roomId={testRoom.id} />);
		const conversationCollapsedView = screen.getByTestId('conversationCollapsedView');
		expect(conversationCollapsedView).toBeInTheDocument();
		const infoPanelToggle = screen.getByTestId('infoPanelToggle');
		expect(infoPanelToggle).toBeInTheDocument();
		await user.click(infoPanelToggle);
		const conversationInfoPanelOpen = await screen.findByTestId('conversationInfoPanelOpen');
		expect(conversationInfoPanelOpen).toBeInTheDocument();
		const userName = screen.getByText(/User 2/i);
		expect(userName).toBeInTheDocument();
		const roomName = screen.getByText(/Name of the group/i);
		expect(roomName).toBeInTheDocument();
		const roomDescription = screen.getByText(/A description/i);
		expect(roomDescription).toBeInTheDocument();
	});
	test('Leave a group and check everything is shown correctly', async () => {
		mockUseMediaQueryCheck.mockReturnValue(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(testRoom2);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		mockedDeleteRoomMemberRequest.mockReturnValueOnce('you left the conversation');
		mockGoToMainPage.mockReturnValueOnce('main page');
		const { user } = setup(<Conversation roomId={testRoom.id} />);
		expect(screen.getByText(/Leave Group/i)).toBeInTheDocument();
		await user.click(screen.getByText(/Leave Group/i));
		const leaveModal = screen.getByTestId('leave_modal');
		expect(leaveModal).toBeInTheDocument();
		const button = await screen.findByRole('button', { name: 'Leave' });
		await waitFor(() => {
			act(() => {
				user.click(button);
			});
		});
		expect(mockedDeleteRoomMemberRequest).toHaveBeenCalledTimes(1);
		expect(mockGoToMainPage).toHaveBeenCalledTimes(1);
	});
	test('Display conversation view with darkMode disabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(false);
		const store = useStore.getState();
		store.addRoom(testRoom);
		setup(<Conversation roomId={testRoom.id} />);
		const ConversationWrapper = screen.getByTestId('ConversationWrapper');
		expect(ConversationWrapper).toHaveStyle(`background-image: url('papyrus.png')`);
	});
	test('Display conversation view with darkMode enabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		setup(<Conversation roomId={testRoom.id} />);
		const ConversationWrapper = screen.getByTestId('ConversationWrapper');
		expect(ConversationWrapper).toHaveStyle(`background-image: url('papyrus-dark.png')`);
	});
});
