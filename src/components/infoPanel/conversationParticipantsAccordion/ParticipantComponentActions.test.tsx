/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { setup } from 'test-utils';

import {
	mockedAddRoomRequest,
	mockedDeleteRoomMemberRequest,
	mockedDeleteRoomRequest,
	mockedDemotesRoomMemberRequest,
	mockedPromoteRoomMemberRequest,
	mockGoToMainPage,
	mockGoToRoomPage
} from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { RoomType } from '../../../types/network/models/roomBeTypes';
import { User } from '../../../types/store/UserTypes';
import GoToPrivateChatAction from './GoToPrivateChatAction';
import LeaveConversationListAction from './LeaveConversationListAction';
import ParticipantComponentInfo from './ParticipantComponentInfo';
import RemoveMemberListAction from './RemoveMemberListAction';

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
		await user.click(screen.getByTestId('go_to_private_chat'));
		expect(mockGoToRoomPage).toBeCalled();

		// store checks
		expect(result.current.rooms['room-id']).toBeDefined();
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

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('leave_modal')).not.toBeInTheDocument();
	});
	test('leave conversation', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user2Info.id, user2Info.name);
			result.current.addRoom(mockedRoom);
		});
		mockedDeleteRoomMemberRequest
			// for testing catch statement
			.mockRejectedValueOnce("you're still here")
			// for testing then statement
			.mockReturnValueOnce('you left the conversation');
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
		await user.click(screen.getByTestId('icon: LogOut'));
		const button = screen.getAllByRole('button')[2];
		await user.click(button);
		expect(mockGoToMainPage).not.toBeCalled();
		await user.click(button);
		expect(mockGoToMainPage).toBeCalled();

		// store checks
		expect(result.current.rooms[mockedRoom.id]).not.toBeDefined();
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
		await user.click(screen.getByTestId('icon: Trash2Outline'));
		expect(screen.getByTestId('delete_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('delete_modal')).not.toBeInTheDocument();
	});
	test('delete conversation', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.addRoom(mockedRoom2);
		});
		mockedDeleteRoomRequest
			// for testing catch statement
			.mockRejectedValueOnce("conversation's still here")
			// for testing then statement
			.mockReturnValueOnce('the conversation has been deleted');
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

		await user.click(screen.getByTestId('icon: Trash2Outline'));
		const button = screen.getAllByRole('button')[2];
		await user.click(button);
		expect(mockGoToMainPage).not.toBeCalled();
		await user.click(button);
		expect(mockGoToMainPage).toBeCalled();

		// store checks
		expect(result.current.rooms[mockedRoom2.id]).not.toBeDefined();
	});
});

describe('participants actions - promote/demote member', () => {
	test('promote/demote member', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});
		mockedPromoteRoomMemberRequest
			.mockRejectedValueOnce('not promoted')
			.mockReturnValueOnce('promoted');

		mockedDemotesRoomMemberRequest
			.mockRejectedValueOnce('not promoted')
			.mockReturnValueOnce('promoted');
		const { user } = setup(
			<ParticipantComponentInfo roomId={mockedRoom.id} member={userInfoMember} />
		);

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// Promote member
		await user.click(promoteButton);
		expect(promoteButton).toBeInTheDocument();

		await user.click(promoteButton);
		const button = await screen.findByTestId('icon: Crown');
		expect(button).toBeInTheDocument();

		// store checks
		expect(result.current.rooms[mockedRoom.id].members?.[1].owner).toBe(true);

		// Demote member
		await user.click(button);
		expect(button).toBeInTheDocument();

		await user.click(button);
		expect(screen.getByTestId('icon: CrownOutline')).toBeInTheDocument();

		// store checks
		expect(result.current.rooms[mockedRoom.id].members?.[1].owner).toBe(false);
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

		await user.click(screen.getByTestId('icon: Trash2Outline'));
		expect(screen.getByTestId('delete_user_modal')).toBeInTheDocument();

		await user.click(screen.getByTestId('icon: Close'));
		expect(screen.queryByTestId('delete_user_modal')).not.toBeInTheDocument();
	});

	test('delete user', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.name);
			result.current.setUserInfo(user2Info);
			result.current.addRoom(mockedRoom);
		});
		mockedDeleteRoomMemberRequest
			// for testing catch statement
			.mockRejectedValueOnce('user is still here')
			// for testing then statement
			.mockReturnValueOnce('user has been kicked out from the conversation');
		const { user } = setup(
			<RemoveMemberListAction roomId={mockedRoom.id} memberId={user2Info.id} />
		);

		await user.click(screen.getByTestId('icon: Trash2Outline'));
		const button = screen.getAllByRole('button')[2];
		await user.click(button);
		expect(screen.getByTestId('icon: Close')).toBeInTheDocument();

		await user.click(button);
		expect(mockedDeleteRoomMemberRequest).toBeCalledTimes(2);

		// store checks
		expect(result.current.rooms[mockedRoom.id].members?.length).toBe(1);
	});
});
