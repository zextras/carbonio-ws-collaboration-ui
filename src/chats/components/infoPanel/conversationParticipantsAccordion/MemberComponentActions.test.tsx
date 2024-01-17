/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import MemberComponentInfo from './MemberComponentInfo';
import RemoveMemberListAction from './RemoveMemberListAction';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import {
	mockedAddRoomRequest,
	mockedDeleteRoomMemberRequest,
	mockedDeleteRoomRequest,
	mockedDemotesRoomMemberRequest,
	mockedPromoteRoomMemberRequest
} from '../../../../tests/mocks/network';
import { mockGoToMainPage, mockGoToRoomPage } from '../../../../tests/mocks/useRouting';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { User } from '../../../../types/store/UserTypes';

const iconClose = 'icon: Close';
const iconTrash2Outline = 'icon: Trash2Outline';

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

const user3Info: User = {
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3'
};

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

describe('participants actions - go to private chat', () => {
	test('existent chat', async () => {
		const store = useStore.getState();
		store.setLoginInfo(user2Info.id, user2Info.name);
		store.addRoom(mockedOneToOne);
		mockGoToRoomPage.mockReturnValue(`room of ${user1Info.name}`);
		const { user } = setup(<GoToPrivateChatAction memberId={user1Info.id} />);
		await user.click(screen.getByTestId('go_to_private_chat'));
		expect(mockGoToRoomPage).toBeCalled();
	});
	test('non-existent chat', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user2Info.id, user2Info.name);
			result.current.setUserInfo(user1Info);
		});
		mockedAddRoomRequest.mockReturnValue({
			id: 'room-id',
			name: ' ',
			description: '',
			membersIds: [user1Info.id]
		});
		mockGoToRoomPage.mockReturnValue(`room of ${user1Info.name}`);
		const { user } = setup(<GoToPrivateChatAction memberId={user1Info.id} />);
		user.click(screen.getByTestId('go_to_private_chat'));
		await waitFor(() => {
			expect(mockGoToRoomPage).toBeCalled();
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
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user2Info.id, user2Info.name);
			result.current.addRoom(mockedRoom);
		});
		mockedDeleteRoomMemberRequest.mockReturnValueOnce('you left the conversation');
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
		user.click(logout);
		const button = await screen.findByRole('button', { name: 'Leave' });

		user.click(button);
		await waitFor(() => expect(mockedDeleteRoomMemberRequest).toBeCalled());
		await waitFor(() => expect(mockGoToMainPage).toBeCalled());
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
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.addRoom(mockedRoom2);
		});
		mockedDeleteRoomRequest.mockReturnValueOnce('the conversation has been deleted');
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

		user.click(screen.getByTestId(iconTrash2Outline));
		const button = await screen.findByRole('button', { name: 'Delete' });
		user.click(button);
		await waitFor(() => expect(mockedDeleteRoomRequest).toBeCalled());
		await waitFor(() => expect(mockGoToMainPage).toBeCalled());
	});
});

describe('participants actions - promote/demote member', () => {
	test('Promote member', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});
		mockedPromoteRoomMemberRequest.mockReturnValueOnce('promoted');

		const { user } = setup(<MemberComponentInfo roomId={mockedRoom.id} member={userInfoMember} />);

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// Promote member
		user.click(promoteButton);

		await waitFor(() => expect(mockedPromoteRoomMemberRequest).toBeCalled());
	});

	test('Demote member', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user3Info);
			result.current.addRoom(mockedRoom);
		});

		mockedDemotesRoomMemberRequest.mockReturnValueOnce('demoted');
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

		user.click(demoteButton);

		await waitFor(() => expect(mockedDemotesRoomMemberRequest).toBeCalled());
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
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});
		mockedDeleteRoomMemberRequest.mockReturnValueOnce(
			'user has been kicked out from the conversation'
		);
		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		user.click(screen.getByTestId(iconTrash2Outline));
		const button = await screen.findByRole('button', { name: 'Remove' });

		user.click(button);
		await waitFor(() => expect(mockedDeleteRoomMemberRequest).toBeCalled());
	});
});
