/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';

import { ActionsAccordion } from './ActionsAccordion';
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

const iconChevronUp = 'icon: ChevronUp';
const iconChevronDown = 'icon: ChevronDown';

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
		store.addRooms([room]);
		store.newMessage(message);

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
		store.addRooms([room]);
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
		store.addRooms([room]);
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
		store.addRooms([room]);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.queryByText(/Clear History/i)).not.toBeInTheDocument();

		act(() => store.newMessage(message));
		expect(screen.getByText(/Clear History/i)).toBeInTheDocument();
	});

	test('Set open/close accordion status', async () => {
		const room: RoomBe = createMockRoom();
		const store = useStore.getState();
		store.addRooms([room]);
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
		store.addRooms([room]);
		store.setActionsAccordionStatus(room.id, true);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.getByText(/Mute notifications/i)).toBeVisible();
		expect(screen.getByTestId(iconChevronUp)).toBeInTheDocument();
	});

	test('Initial accordion status: false', async () => {
		const room: RoomBe = createMockRoom();
		const store = useStore.getState();
		store.addRooms([room]);
		store.setActionsAccordionStatus(room.id, false);

		setup(<ActionsAccordion roomId={room.id} />);
		expect(screen.queryByText(/Mute notifications/i)).not.toBeInTheDocument();
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
		store.addRooms([room]);
		store.setAttributes(createMockAttributesList({ carbonioWscMaxGroupMembers: '3' }));

		setup(<ActionsAccordion roomId={room.id} />);
		const addNewMemberActionButton = screen.getByRoleWithIcon('button', {
			icon: 'icon: PersonAddOutline'
		});
		expect(addNewMemberActionButton).toBeDisabled();
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
		store.addRooms([room]);
		store.setAttributes(createMockAttributesList({ carbonioWscMaxGroupMembers: '5' }));

		setup(<ActionsAccordion roomId={room.id} />);
		const addNewMemberAction = screen.getByTestId('addNewMemberAction');
		expect(addNewMemberAction).toBeEnabled();
	});
});
