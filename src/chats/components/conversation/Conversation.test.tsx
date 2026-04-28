/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';

import Conversation from './Conversation';
import { mockDarkReaderIsEnabled } from '../../../../__mocks__/darkreader';
import { mockUseMediaQueryCheck } from '../../../hooks/__mocks__/useMediaQueryCheck';
import { mockGoToMainPage } from '../../../hooks/__mocks__/useRouting';
import * as api from '../../../network/apis/RoomsApi';
import { wsEventsHandler } from '../../../network/websocket/wsEventsHandler';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
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

const InfoIconTestId = 'icon: InfoOutline';
const MessageCircleIcon = 'icon: MessageCircleOutline';

vi.mock('../../../hooks/useRouting');
vi.mock('../../../hooks/useMediaQueryCheck');

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1Info.id, name: user1Info.email, displayName: user1Info.name });
	store.setUserInfo([user2Info]);
	store.addRooms([testRoom, testRoom2]);
});
describe('Conversation view', () => {
	describe('Small view screen', () => {
		test('Display conversation view on small screen and toggle info panel', async () => {
			mockUseMediaQueryCheck.mockReturnValue(false);
			const { user } = setup(<Conversation roomId={testRoom.id} />);
			await user.click(screen.getByTestId(InfoIconTestId));
			expect(screen.getByText('Info')).toBeInTheDocument();
			await user.click(screen.getByTestId(MessageCircleIcon));
			expect(screen.getByTestId(InfoIconTestId)).toBeInTheDocument();
		});

		test('Display conversation view on small screen and toggle search panel', async () => {
			mockUseMediaQueryCheck.mockReturnValue(false);
			const { user } = setup(<Conversation roomId={testRoom.id} />);
			const searchButton = screen.getByRoleWithIcon('textbox', { icon: 'icon: Search' });
			expect(searchButton).toBeVisible();
			await user.click(searchButton);
			expect(screen.getByRole('textbox', { name: /search messages/i })).toBeVisible();
			expect(screen.queryByTestId('conversationCollapsedView')).not.toBeInTheDocument();
			// there are two icons: one to go on conversation view and one on the displayer
			const messagesIcon = screen.getAllByTestId(MessageCircleIcon);
			expect(messagesIcon).toHaveLength(2);
			await user.click(messagesIcon[0]);
			expect(screen.getByTestId(InfoIconTestId)).toBeVisible();
		});
	});

	test('Display conversation view and info panel, then render search panel instead of info', async () => {
		mockUseMediaQueryCheck.mockReturnValue(true);
		const { user } = setup(<Conversation roomId={testRoom.id} />);
		expect(screen.getByText('Info')).toBeVisible();
		const searchIcons = screen.getAllByTestId('icon: Search');
		expect(searchIcons).toHaveLength(1);
		await user.click(searchIcons[0]);
		expect(screen.queryByText('Info')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: /search messages/i })).toBeVisible();
		await user.click(screen.getByTestId(MessageCircleIcon));
	});

	describe('Info Panel', () => {
		test('Display info panel and check data are visible', async () => {
			mockUseMediaQueryCheck.mockReturnValue(false);
			const { user } = setup(<Conversation roomId={testRoom.id} />);
			await user.click(screen.getByTestId(InfoIconTestId));
			expect(screen.getByText('Info')).toBeInTheDocument();
			const roomName = screen.getByText(/Name of the group/i);
			expect(roomName).toBeInTheDocument();
			const roomDescription = screen.getByText(/A description/i);
			expect(roomDescription).toBeInTheDocument();
			await user.click(screen.getByText('Members'));
			expect(screen.getByText(/User 2/i)).toBeInTheDocument();
		});

		test('Leave a group and check everything is shown correctly', async () => {
			const spyOnDeleteRoomMember = vi.spyOn(api, 'deleteRoomMember');
			mockUseMediaQueryCheck.mockReturnValue(true);
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
			setup(<Conversation roomId={testRoom.id} />);
			const ConversationWrapper = screen.getByTestId(`ConversationWrapper-${testRoom.id}`);
			expect(ConversationWrapper).toHaveStyle(
				`background-image: url("/src/chats/assets/papyrus.png")`
			);
		});

		test('Display conversation view with darkMode enabled', async () => {
			mockDarkReaderIsEnabled.mockReturnValueOnce(true);
			setup(<Conversation roomId={testRoom.id} />);
			const ConversationWrapper = screen.getByTestId(`ConversationWrapper-${testRoom.id}`);
			expect(ConversationWrapper).toHaveStyle(
				`background-image: url("/src/chats/assets/papyrus-dark.png")`
			);
		});

		test('Add moderator and check everything is shown correctly', async () => {
			mockUseMediaQueryCheck.mockReturnValue(true);
			const { user } = setup(<Conversation roomId={testRoom.id} />);
			act(() => {
				useStore.getState().setMemberModeratorStatus(testRoom.id, user1Info.id, true);
				wsEventsHandler({
					type: WsEventType.ROOM_OWNER_PROMOTED,
					sentDate: new Date().toISOString(),
					roomId: testRoom.id,
					userId: user1Info.id
				} as RoomOwnerPromotedEvent);
			});
			await user.click(screen.getByText('Members'));
			const crownCounter = await screen.findAllByTestId('icon: Crown');
			expect(crownCounter).toHaveLength(2);
			const snackbar = await screen.findByText(
				`Congratulations! You are now a moderator of ${testRoom.name} group.`
			);
			expect(snackbar).toBeInTheDocument();
		});

		test('Remove moderator and check everything is shown correctly', async () => {
			setup(<Conversation roomId={testRoom2.id} />);
			act(() => {
				useStore.getState().setMemberModeratorStatus(testRoom2.id, user1Info.id, false);
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
});
