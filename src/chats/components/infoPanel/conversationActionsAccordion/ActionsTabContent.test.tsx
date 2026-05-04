/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';

import { ActionsTabContent } from './ActionsTabContent';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup, screen } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';

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

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo([user1Be, user2Be, user3Be]);
	store.setLoginInfo({ id: user1Be.id, name: user1Be.name });
});

describe('Actions Tab Content', () => {
	test('A owner of a group should see the correct actions - More than one owner', () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members: [
				createMockMember({ userId: user1Be.id, owner: true }),
				createMockMember({ userId: user2Be.id }),
				createMockMember({ userId: user3Be.id, owner: true })
			]
		});
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRooms([room]);
		store.newMessage(message);

		setup(<ActionsTabContent roomId={room.id} />);
		expect(screen.getByText(/Mute Notifications/i)).toBeInTheDocument();
		expect(screen.getByText(/Add New Members/i)).toBeInTheDocument();
		expect(screen.getByText(/Edit Details/i)).toBeInTheDocument();
		expect(screen.getByText(/Clear History/i)).toBeInTheDocument();
		expect(screen.getByText(/Leave Group/i)).toBeInTheDocument();
		expect(screen.getByText(/Delete Group/i)).toBeInTheDocument();
	});

	test('In a one_to_one users should see only mute actions', () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.ONE_TO_ONE,
			members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user2Be.id })]
		});
		const store = useStore.getState();
		store.addRooms([room]);

		setup(<ActionsTabContent roomId={room.id} />);
		expect(screen.getByText(/Mute Notifications/i)).toBeInTheDocument();
		expect(screen.queryByText(/Add New Members/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/Edit Details/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/Leave Group/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/Delete Group/i)).not.toBeInTheDocument();
	});

	test('A owner of a group should see the correct actions - One owner', () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members: [
				createMockMember({ userId: user1Be.id, owner: true }),
				createMockMember({ userId: user2Be.id }),
				createMockMember({ userId: user3Be.id })
			]
		});
		const store = useStore.getState();
		store.addRooms([room]);

		setup(<ActionsTabContent roomId={room.id} />);
		expect(screen.getByText(/Mute Notifications/i)).toBeInTheDocument();
		expect(screen.getByText(/Add New Members/i)).toBeInTheDocument();
		expect(screen.getByText(/Edit Details/i)).toBeInTheDocument();
		expect(screen.queryByText(/Leave Group/i)).not.toBeInTheDocument();
		expect(screen.getByText(/Delete Group/i)).toBeInTheDocument();
	});

	test('See Clear History action only if there are some messages in the conversation', () => {
		const room: RoomBe = createMockRoom({ members: [createMockMember({ userId: user1Be.id })] });
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRooms([room]);

		setup(<ActionsTabContent roomId={room.id} />);
		expect(screen.queryByText(/Clear History/i)).not.toBeInTheDocument();

		act(() => store.newMessage(message));
		expect(screen.getByText(/Clear History/i)).toBeInTheDocument();
	});

	test('A owner of a group should see add member disabled', () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members: [
				createMockMember({ userId: user1Be.id, owner: true }),
				createMockMember({ userId: user2Be.id }),
				createMockMember({ userId: user3Be.id })
			]
		});
		const store = useStore.getState();
		store.addRooms([room]);
		store.setAttributes(createMockAttributesList({ carbonioWscMaxGroupMembers: '3' }));

		setup(<ActionsTabContent roomId={room.id} />);
		const addNewMemberActionButton = screen.getByRoleWithIcon('button', {
			icon: 'icon: PersonAddOutline'
		});
		expect(addNewMemberActionButton).toBeDisabled();
	});

	test('A owner of a group should see add member enabled', () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members: [
				createMockMember({ userId: user1Be.id, owner: true }),
				createMockMember({ userId: user2Be.id }),
				createMockMember({ userId: user3Be.id })
			]
		});
		const store = useStore.getState();
		store.addRooms([room]);
		store.setAttributes(createMockAttributesList({ carbonioWscMaxGroupMembers: '5' }));

		setup(<ActionsTabContent roomId={room.id} />);
		const addNewMemberAction = screen.getByTestId('addNewMemberAction');
		expect(addNewMemberAction).toBeEnabled();
	});
});
