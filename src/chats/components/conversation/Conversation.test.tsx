/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import Conversation from './Conversation';
import { mockDarkReaderIsEnabled } from '../../../../__mocks__/darkreader';
import { wsEventsHandler } from '../../../network/websocket/wsEventsHandler';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../tests/mocks/network';
import { mockUseMediaQueryCheck } from '../../../tests/mocks/useMediaQueryCheck';
import { mockGoToMainPage } from '../../../tests/mocks/useRouting';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import {
	RoomOwnerDemotedEvent,
	RoomOwnerPromotedEvent
} from '../../../types/network/websocket/wsConversationEvents';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
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
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const user1Info: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const user2Info: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
});

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
		const spyOnDeleteRoomMember = spyOnRoomsApi(RoomsApiToSpy.DELETE_ROOM_MEMBER);
		mockUseMediaQueryCheck.mockReturnValue(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(testRoom2);
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.setUserInfo(user2Info);
		mockGoToMainPage.mockReturnValueOnce('main page');
		const { user } = setup(<Conversation roomId={testRoom.id} />);
		expect(screen.getByText(/Leave Group/i)).toBeInTheDocument();
		await user.click(screen.getByText(/Leave Group/i));
		const leaveModal = screen.getByTestId('leave_modal');
		expect(leaveModal).toBeInTheDocument();
		const button = await screen.findByRole('button', { name: 'Leave' });
		await user.click(button);
		expect(spyOnDeleteRoomMember).toHaveBeenCalledTimes(1);
		expect(mockGoToMainPage).toHaveBeenCalledTimes(1);
	});

	test('Display conversation view with darkMode disabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(false);
		const store = useStore.getState();
		store.addRoom(testRoom);
		setup(<Conversation roomId={testRoom.id} />);
		const ConversationWrapper = screen.getByTestId(`ConversationWrapper-${testRoom.id}`);
		expect(ConversationWrapper).toHaveStyle(`background-image: url('papyrus.png')`);
	});

	test('Display conversation view with darkMode enabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(true);
		const store = useStore.getState();
		store.addRoom(testRoom);
		setup(<Conversation roomId={testRoom.id} />);
		const ConversationWrapper = screen.getByTestId(`ConversationWrapper-${testRoom.id}`);
		expect(ConversationWrapper).toHaveStyle(`background-image: url('papyrus-dark.png')`);
	});

	test('Add moderator and check everything is shown correctly', async () => {
		act(() => {
			useStore.getState().addRoom(testRoom);
			useStore.getState().setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			useStore.getState().setUserInfo(user1Info);
			useStore.getState().setUserInfo(user2Info);
		});
		setup(<Conversation roomId={testRoom.id} />);
		act(() => {
			useStore.getState().promoteMemberToModerator(testRoom.id, user1Info.id);
			wsEventsHandler({
				type: WsEventType.ROOM_OWNER_PROMOTED,
				sentDate: new Date().toISOString(),
				roomId: testRoom.id,
				userId: user1Info.id
			} as RoomOwnerPromotedEvent);
		});
		const crownCounter = await screen.findAllByTestId('icon: Crown');
		expect(crownCounter).toHaveLength(2);
		const snackbar = await screen.findByText(
			`Congratulations! You are now a moderator of ${testRoom.name} group.`
		);
		expect(snackbar).toBeInTheDocument();
	});

	test('Remove moderator and check everything is shown correctly', async () => {
		act(() => {
			useStore.getState().addRoom(testRoom2);
			useStore.getState().setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			useStore.getState().setUserInfo(user1Info);
			useStore.getState().setUserInfo(user2Info);
		});
		setup(<Conversation roomId={testRoom2.id} />);
		act(() => {
			useStore.getState().demoteMemberFromModerator(testRoom2.id, user1Info.id);
			wsEventsHandler({
				type: WsEventType.ROOM_OWNER_DEMOTED,
				sentDate: new Date().toISOString(),
				roomId: testRoom2.id,
				userId: user1Info.id
			} as RoomOwnerDemotedEvent);
		});
		const snackbar = await screen.findByText(
			`You are no longer a moderator of ${testRoom2.name} group.`
		);
		expect(snackbar).toBeInTheDocument();
	});
});
