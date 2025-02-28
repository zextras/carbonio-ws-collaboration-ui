/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook, screen, waitFor } from '@testing-library/react';

import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import MemberComponentInfo from './MemberComponentInfo';
import RemoveMemberListAction from './RemoveMemberListAction';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../../tests/mocks/network';
import { mockGoToMainPage, mockGoToRoomPage } from '../../../../tests/mocks/useRouting';
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
	id: 'roomId',
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

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user2Info.id, user2Info.name);
	store.setUserInfo(user1Info);
	store.addRoom(mockedOneToOne);
	store.setAttributes(
		createMockAttributesList({
			carbonioWscPrivateChatCreation: 'TRUE'
		})
	);
});
describe('participants actions - go to private chat', () => {
	test('existent chat', async () => {
		mockGoToRoomPage.mockReturnValue(`room of ${user1Info.name}`);
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
		const store = useStore.getState();
		store.setLoginInfo(user2Info.id, user2Info.name);
		store.addRoom(mockedRoom);
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
		const spyOnDeleteRoomMember = spyOnRoomsApi(RoomsApiToSpy.DELETE_ROOM_MEMBER);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user2Info.id, user2Info.name);
			result.current.addRoom(mockedRoom);
		});
		mockGoToMainPage.mockReturnValue('main page');
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
		const store = useStore.getState();
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.addRoom(mockedRoom2);
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
		const spyOnDeleteRoom = spyOnRoomsApi(RoomsApiToSpy.DELETE_ROOM);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.addRoom(mockedRoom2);
		});
		mockGoToMainPage.mockReturnValue('main page');
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
		const spyOnPromoteRoomMember = spyOnRoomsApi(RoomsApiToSpy.PROMOTE_ROOM_MEMBER);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});

		const { user } = setup(<MemberComponentInfo roomId={mockedRoom.id} member={userInfoMember} />);

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// Promote member
		await user.click(promoteButton);

		expect(spyOnPromoteRoomMember).toHaveBeenCalled();
	});

	test('Demote member', async () => {
		const spyOnDemoteRoomMember = spyOnRoomsApi(RoomsApiToSpy.DEMOTE_ROOM_MEMBER);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user3Info);
			result.current.addRoom(mockedRoom);
		});

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
		const store = useStore.getState();
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setUserInfo(user2Info);
		store.addRoom(mockedRoom);
		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		await user.click(screen.getByTestId(iconTrash2Outline));
		expect(screen.getByTestId('delete_user_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId(iconClose));
		expect(screen.queryByTestId('delete_user_modal')).not.toBeInTheDocument();
	});

	test('delete user', async () => {
		const spyOnDeleteRoomMember = spyOnRoomsApi(RoomsApiToSpy.DELETE_ROOM_MEMBER);
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});

		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		await user.click(screen.getByTestId(iconTrash2Outline));
		const button = await screen.findByRole('button', { name: 'Remove' });

		await user.click(button);
		expect(spyOnDeleteRoomMember).toHaveBeenCalled();
	});
});
