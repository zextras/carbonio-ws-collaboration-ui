/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act } from '@testing-library/react';

import { ActionsAccordion } from './ActionsAccordion';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';

const iconChevronUp = 'icon: ChevronUp';
const iconChevronDown = 'icon: ChevronDown';

const user1Be: UserBe = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
});

const user2Be: UserBe = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
});

const user3Be: UserBe = createMockUser({
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User 3',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 3"
});

describe('Actions Accordion', () => {
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
		store.addRoom(room);
		store.newMessage(message);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setLoginInfo(user1Be.id, user1Be.name);

		setup(<ActionsAccordion roomId={room.id} />);
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
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setLoginInfo(user1Be.id, user1Be.name);
		setup(<ActionsAccordion roomId={room.id} />);
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
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setLoginInfo(user1Be.id, user1Be.name);
		setup(<ActionsAccordion roomId={room.id} />);
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
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setLoginInfo(user1Be.id, user1Be.name);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.queryByText(/Clear History/i)).not.toBeInTheDocument();

		act(() => store.newMessage(message));
		expect(screen.getByText(/Clear History/i)).toBeInTheDocument();
	});

	test('Set open/close accordion status', async () => {
		const room: RoomBe = createMockRoom();
		const store = useStore.getState();
		store.addRoom(room);
		// Default status: open
		const { user } = setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.getByText(/Mute notifications/i)).toBeVisible();

		// Check store change
		const closeAccordionButton = screen.getByTestId(iconChevronUp);
		await user.click(closeAccordionButton);
		expect(
			useStore.getState().activeConversations[room.id].infoPanelStatus!.actionsAccordionIsOpened
		).toBeFalsy();

		const openAccordionButton = screen.getByTestId(iconChevronDown);
		await user.click(openAccordionButton);
		expect(
			useStore.getState().activeConversations[room.id].infoPanelStatus!.actionsAccordionIsOpened
		).toBeTruthy();
	});

	test('Initial accordion status: true', async () => {
		const room: RoomBe = createMockRoom();
		const store = useStore.getState();
		store.addRoom(room);
		store.setActionsAccordionStatus(room.id, true);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.getByText(/Mute notifications/i)).toBeVisible();
		expect(screen.getByTestId(iconChevronUp)).toBeInTheDocument();
	});

	test('Initial accordion status: false', async () => {
		const room: RoomBe = createMockRoom();
		const store = useStore.getState();
		store.addRoom(room);
		store.setActionsAccordionStatus(room.id, false);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.queryByText(/Mute notifications/i)).not.toBeVisible();
		expect(screen.getByTestId(iconChevronDown)).toBeInTheDocument();
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
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ maxGroupMembers: 3 }));

		setup(<ActionsAccordion roomId={room.id} />);
		const addNewMemberAction = screen.getByTestId('addNewMemberAction');
		expect(addNewMemberAction).toHaveAttribute('disabled');

		const leaveActionButton = screen.getByTestId('leaveActionButton');
		expect(leaveActionButton).toBeDisabled();
	});

	test('A owner of a group should see add member enabled', async () => {
		const room: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members: [
				createMockMember({ userId: user1Be.id, owner: true }),
				createMockMember({ userId: user2Be.id }),
				createMockMember({ userId: user3Be.id })
			]
		});
		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		store.setUserInfo(user3Be);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ maxGroupMembers: 5 }));

		setup(<ActionsAccordion roomId={room.id} />);
		const addNewMemberAction = screen.getByTestId('addNewMemberAction');
		expect(addNewMemberAction).toBeEnabled();
	});
});
