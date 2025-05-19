/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import MemberComponentInfo from './MemberComponentInfo';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';

const iconCrown = 'icon: Crown';
const iconLogOut = 'icon: LogOut';
const iconMessageCircleOutline = 'icon: MessageCircleOutline';

const user1Be: UserBe = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const user2Be: UserBe = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2'
});

const user3Be: UserBe = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3'
});

const user4Be: UserBe = createMockUser({
	id: 'user4',
	email: 'user4@domain.com',
	name: 'User 4'
});

const members = [
	createMockMember({ userId: user1Be.id, owner: true }),
	createMockMember({ userId: user2Be.id }),
	createMockMember({ userId: user3Be.id, owner: true }),
	createMockMember({ userId: user4Be.id })
];

const membersWithOneOwner = [
	createMockMember({ userId: user1Be.id, owner: true }),
	createMockMember({ userId: user4Be.id })
];

const mockedRoom = createMockRoom({
	type: RoomType.GROUP,
	members
});

const mockedRoomOneOwner = createMockRoom({
	type: RoomType.GROUP,
	members: membersWithOneOwner
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1Be.id, user1Be.name);
	store.addRooms([mockedRoomOneOwner, mockedRoom]);
	store.setUserInfo([user1Be, user2Be, user3Be, user4Be]);
});

describe('Participant component info', () => {
	describe('User is an owner', () => {
		test('The user is the only owner and sees his element inside list', () => {
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoomOneOwner.id} />);

			const iAmOwnerAction = screen.getByTestId(iconCrown);
			expect(iAmOwnerAction).toBeInTheDocument();
			expect(iAmOwnerAction).toBeEnabled();

			const logoutAction = screen.getByTestId(iconLogOut);
			expect(logoutAction).toBeInTheDocument();
			expect(logoutAction).toBeEnabled();
		});
		test('The user is an owner and sees his element inside list', () => {
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 1/i);
			expect(participantName).toBeInTheDocument();

			const iAmOwnerAction = screen.getByTestId(iconCrown);
			expect(iAmOwnerAction).toBeInTheDocument();
			expect(iAmOwnerAction).toBeEnabled();

			const logoutAction = screen.getByTestId(iconLogOut);
			expect(logoutAction).toBeInTheDocument();
		});
		test('The user is an owner and sees a normal user inside list', () => {
			useStore
				.getState()
				.setAttributes(createMockAttributesList({ carbonioWscPrivateChatCreation: 'TRUE' }));
			setup(<MemberComponentInfo member={members[1]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 2/i);
			expect(participantName).toBeInTheDocument();

			const goToChatAction = screen.getByTestId(iconMessageCircleOutline);
			expect(goToChatAction).toBeInTheDocument();

			const isOwnerAction = screen.getByTestId('icon: CrownOutline');
			expect(isOwnerAction).toBeInTheDocument();

			const deleteUserAction = screen.getByTestId('icon: Trash2Outline');
			expect(deleteUserAction).toBeInTheDocument();
		});
		test('The user is an owner and sees another owner inside list', () => {
			useStore
				.getState()
				.setAttributes(createMockAttributesList({ carbonioWscPrivateChatCreation: 'TRUE' }));

			setup(<MemberComponentInfo member={members[2]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 3/i);
			expect(participantName).toBeInTheDocument();

			const goToChatAction = screen.getByTestId(iconMessageCircleOutline);
			expect(goToChatAction).toBeInTheDocument();

			const isOwnerAction = screen.getByTestId(iconCrown);
			expect(isOwnerAction).toBeInTheDocument();

			const deleteUserAction = screen.getByTestId('icon: Trash2Outline');
			expect(deleteUserAction).toBeInTheDocument();
		});
	});

	describe("User isn't an owner", () => {
		test('The user is not an owner and sees his element inside list', () => {
			const store = useStore.getState();
			store.setLoginInfo('user2', 'User 2');
			store.setAttributes(createMockAttributesList({ carbonioWscPrivateChatCreation: 'TRUE' }));
			setup(<MemberComponentInfo member={members[1]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 2/i);
			expect(participantName).toBeInTheDocument();

			const logoutAction = screen.getByTestId(iconLogOut);
			expect(logoutAction).toBeInTheDocument();
		});
		test('the user is not an owner and sees an owner inside list', () => {
			const store = useStore.getState();
			store.setLoginInfo('user2', 'User 2');
			store.setAttributes(createMockAttributesList({ carbonioWscPrivateChatCreation: 'TRUE' }));
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 1/i);
			expect(participantName).toBeInTheDocument();

			const goToChatAction = screen.getByTestId(iconMessageCircleOutline);
			expect(goToChatAction).toBeInTheDocument();

			const isOwnerAction = screen.getByTestId(iconCrown);
			expect(isOwnerAction).toBeInTheDocument();
		});
		test('The user is not an owner and sees a normal user inside list', () => {
			const store = useStore.getState();
			store.setLoginInfo('user2', 'User 2');
			store.setAttributes(createMockAttributesList({ carbonioWscPrivateChatCreation: 'TRUE' }));
			setup(<MemberComponentInfo member={members[3]} roomId={mockedRoom.id} />);

			const participantName = screen.getByText(/User 4/i);
			expect(participantName).toBeInTheDocument();

			const goToChatAction = screen.getByTestId(iconMessageCircleOutline);
			expect(goToChatAction).toBeInTheDocument();
		});
	});

	describe('Subtitle sentence with showUsersPresence capability set to true', () => {
		test('Label should show Online', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			act(() => store.setUserPresence('user1', true));
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoom.id} />);

			expect(screen.getByText(/You/i)).toBeInTheDocument();
		});
		test('Label should show Offline', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			act(() => store.setUserPresence('user1', false));
			setup(<MemberComponentInfo member={members[1]} roomId={mockedRoom.id} />);

			expect(
				screen.getByText(/Go to private chat to send a personal message/i)
			).toBeInTheDocument();
		});

		test('Label should show "Last seen" phrase if lastActivity is present', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
			act(() => store.setUserLastActivity('user2', 1642818617000));
			setup(<MemberComponentInfo member={members[1]} roomId={mockedRoom.id} />);
			// last activity is 2022/01/22 at 03:30:17
			expect(screen.getByText(/Last seen 01\/22\/2022/i)).toBeInTheDocument();
		});
	});

	describe('Subtitle sentence with showUsersPresence capability set to false', () => {
		test('Label should not show Online', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'FALSE' }));
			act(() => store.setUserPresence('user1', true));
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoom.id} />);

			expect(screen.queryByText(/Online/i)).not.toBeInTheDocument();
		});

		test('Label should not show Offline', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'FALSE' }));
			act(() => store.setUserPresence('user1', false));
			setup(<MemberComponentInfo member={members[0]} roomId={mockedRoom.id} />);
			expect(screen.queryByText(/Offline/i)).not.toBeInTheDocument();
		});

		test('Label should not show "Last seen" phrase if lastActivity is present', () => {
			const store = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'FALSE' }));
			act(() => store.setUserLastActivity('user2', 1642818617000));
			setup(<MemberComponentInfo member={members[1]} roomId={mockedRoom.id} />);
			// last activity is 2022/01/22 at 03:30:17
			expect(screen.queryByText(/Last seen 01\/22\/2022/i)).not.toBeInTheDocument();
		});
	});
});
