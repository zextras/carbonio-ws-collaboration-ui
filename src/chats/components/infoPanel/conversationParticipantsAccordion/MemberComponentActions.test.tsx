/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import MemberComponentInfo from './MemberComponentInfo';
import RemoveMemberListAction from './RemoveMemberListAction';
import { mockGoToMainPage, mockGoToRoomPage } from '../../../../hooks/__mocks__/useRouting';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const iconClose = 'icon: Close';
const iconTrash2Outline = 'icon: Trash2Outline';

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

const user3Info: User = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3'
});

const userInfoMember = {
	userId: user2Info.id,
	owner: false,
	temporary: false,
	external: false
};

const mockedOneToOne = createMockRoom({
	id: 'mockedOneToOneId',
	type: RoomType.ONE_TO_ONE,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Info.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
});

const mockedRoom = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Info.id,
			owner: false,
			temporary: false,
			external: false
		},
		{
			userId: user3Info.id,
			owner: true,
			temporary: false,
			external: false
		}
	]
});

const mockedRoom2 = createMockRoom({
	id: 'room2Id',
	type: RoomType.GROUP,
	members: [
		{
			userId: user1Info.id,
			owner: true,
			temporary: false,
			external: false
		}
	]
});

vi.mock('../../../../hooks/useRouting');

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1Info.id, user1Info.name);
	store.setUserInfo([user1Info, user2Info, user3Info]);
	store.addRooms([mockedOneToOne, mockedRoom, mockedRoom2]);
	store.setAttributes(
		createMockAttributesList({
			carbonioWscPrivateChatCreation: 'TRUE'
		})
	);
});
describe('participants actions - go to private chat', () => {
	test('existent chat', async () => {
		const { user } = setup(<GoToPrivateChatAction memberId={user1Info.id} />);
		await user.click(screen.getByTestId('go_to_private_chat'));
		expect(mockGoToRoomPage).toHaveBeenCalled();
	});
	test('non-existent chat', async () => {
		mockGoToRoomPage.mockReturnValue(`room of ${user1Info.name}`);
		const { user } = setup(<GoToPrivateChatAction memberId={user1Info.id} />);
		await user.click(screen.getByTestId('go_to_private_chat'));
		await waitFor(() => {
			expect(mockGoToRoomPage).toHaveBeenCalled();
		});
	});
});

describe('participants actions - leave/delete conversation', () => {
	test('leave conversation - open and close modal', async () => {
		const { user } = setup(
			<LeaveConversationListAction
				iAmOwner={false}
				numberOfMembers={2}
				isSessionParticipant
				numberOfOwners={1}
				roomId={mockedRoom.id}
			/>
		);
		await user.click(screen.getByTestId('icon: LogOut'));
		expect(screen.getByTestId('leave_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId(iconClose));
		expect(screen.queryByTestId('leave_modal')).not.toBeInTheDocument();
	});
	test('leave conversation', async () => {
		const spyOnDeleteRoomMember = vi.spyOn(roomsApi, 'deleteRoomMember');
		const { user } = setup(
			<LeaveConversationListAction
				iAmOwner={false}
				numberOfMembers={2}
				isSessionParticipant
				numberOfOwners={1}
				roomId={mockedRoom.id}
			/>
		);
		const logout = await screen.findByTestId('icon: LogOut');
		await user.click(logout);
		const button = await screen.findByRole('button', { name: 'Leave' });

		await user.click(button);
		expect(spyOnDeleteRoomMember).toHaveBeenCalled();
		expect(mockGoToMainPage).toHaveBeenCalled();
	});
	test('delete conversation - open and close modal', async () => {
		const { user } = setup(
			<LeaveConversationListAction
				iAmOwner
				numberOfMembers={1}
				isSessionParticipant
				numberOfOwners={1}
				roomId={mockedRoom.id}
			/>
		);
		await user.click(screen.getByTestId(iconTrash2Outline));
		expect(screen.getByTestId('delete_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId(iconClose));
		expect(screen.queryByTestId('delete_modal')).not.toBeInTheDocument();
	});
	test('delete conversation', async () => {
		const spyOnDeleteRoom = vi.spyOn(roomsApi, 'deleteRoom');
		const { user } = setup(
			<LeaveConversationListAction
				iAmOwner
				numberOfMembers={1}
				isSessionParticipant
				numberOfOwners={1}
				roomId={mockedRoom.id}
			/>
		);

		await user.click(screen.getByTestId(iconTrash2Outline));
		const button = await screen.findByRole('button', { name: 'Delete' });
		await user.click(button);
		expect(spyOnDeleteRoom).toHaveBeenCalled();
		expect(mockGoToMainPage).toHaveBeenCalled();
	});
});

describe('participants actions - promote/demote member', () => {
	test('Promote member', async () => {
		const spyOnPromoteRoomMember = vi.spyOn(roomsApi, 'promoteRoomMember');
		const { user } = setup(<MemberComponentInfo roomId={mockedRoom.id} member={userInfoMember} />);

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// Promote member
		await user.click(promoteButton);

		expect(spyOnPromoteRoomMember).toHaveBeenCalled();
	});

	test('Demote member', async () => {
		const spyOnDemoteRoomMember = vi.spyOn(roomsApi, 'demotesRoomMember');
		const { user } = setup(
			<MemberComponentInfo
				roomId={mockedRoom.id}
				member={{
					userId: user3Info.id,
					owner: true,
					temporary: false,
					external: false
				}}
			/>
		);

		const demoteButton = screen.getByTestId('icon: Crown');
		expect(demoteButton).toBeInTheDocument();
		expect(demoteButton).toBeEnabled();

		await user.click(demoteButton);

		expect(spyOnDemoteRoomMember).toHaveBeenCalled();
	});
});

describe('participants actions - delete user', () => {
	test('open/close modal', async () => {
		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		await user.click(screen.getByTestId(iconTrash2Outline));
		expect(screen.getByTestId('delete_user_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId(iconClose));
		expect(screen.queryByTestId('delete_user_modal')).not.toBeInTheDocument();
	});

	test('delete user', async () => {
		const spyOnDeleteRoomMember = vi.spyOn(roomsApi, 'deleteRoomMember');
		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		await user.click(screen.getByTestId(iconTrash2Outline));
		const button = await screen.findByRole('button', { name: 'Remove' });

		await user.click(button);
		expect(spyOnDeleteRoomMember).toHaveBeenCalled();
	});
});
