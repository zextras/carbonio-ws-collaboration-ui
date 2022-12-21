/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockRoom } from '../../../tests/createMock';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { ParticipantsAccordion } from './ParticipantsAccordion';

const user1Be: UserBe = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};
const user2Be: UserBe = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User 2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const member = [
	{
		userId: 'user1',
		owner: true,
		temporary: false,
		external: false
	}
];

const members = [
	{
		userId: 'user1',
		owner: true,
		temporary: false,
		external: false
	},
	{
		userId: 'user2',
		owner: false,
		temporary: false,
		external: false
	}
];
describe('Participants accordion', () => {
	test('Title should be plural', () => {
		const room: RoomBe = {
			id: 'Room-Id',
			name: 'Room Name',
			description: 'This is the description of the group',
			type: RoomType.GROUP,
			hash: 'hash',
			createdAt: '1234567',
			updatedAt: '12345678',
			pictureUpdatedAt: '123456789',
			members
		};

		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		store.setUserInfo(user2Be);
		setup(<ParticipantsAccordion roomId={room.id} />);
		const titleIsPlural = screen.getByText(/2 Participants/i);
		expect(titleIsPlural).toBeInTheDocument();
	});

	test('Title should be singular', () => {
		const room: RoomBe = {
			id: 'Room-Id',
			name: 'Room Name',
			description: 'This is the description of the group',
			type: RoomType.GROUP,
			hash: 'hash',
			createdAt: '1234567',
			updatedAt: '12345678',
			pictureUpdatedAt: '123456789',
			members: member
		};

		const store = useStore.getState();
		store.addRoom(room);
		store.setUserInfo(user1Be);
		setup(<ParticipantsAccordion roomId={room.id} />);
		const titleIsSingular = screen.getByText(/One Participant/i);
		expect(titleIsSingular).toBeInTheDocument();
	});

	test('Set open/close accordion status', async () => {
		const room: RoomBe = createMockRoom({ type: RoomType.GROUP });
		const store = useStore.getState();
		store.addRoom(room);

		// Default status: open
		const { user } = setup(<ParticipantsAccordion roomId={room.id} />);
		expect(screen.getByText(/Search Participants/i)).toBeVisible();

		// Check store change
		const closeAccordionButton = screen.getByTestId('icon: ChevronUp');
		await user.click(closeAccordionButton);
		const { infoPanelStatus } = useStore.getState().activeConversations[room.id];
		expect(infoPanelStatus!.participantsAccordionIsOpened).toBeFalsy();

		const openAccordionButton = screen.getByTestId('icon: ChevronDown');
		await user.click(openAccordionButton);
		const infoPanelStatus2 = useStore.getState().activeConversations[room.id].infoPanelStatus!;
		expect(infoPanelStatus2.participantsAccordionIsOpened).toBeTruthy();
	});

	test('Initial accordion status: true', async () => {
		const room: RoomBe = createMockRoom({ type: RoomType.GROUP });
		const store = useStore.getState();
		store.addRoom(room);
		store.setParticipantsAccordionStatus(room.id, true);

		setup(<ParticipantsAccordion roomId={room.id} />);
		expect(screen.getByText(/Search Participants/i)).toBeVisible();
		expect(screen.getByTestId('icon: ChevronUp')).toBeInTheDocument();
	});

	test('Initial accordion status: false', async () => {
		const room: RoomBe = createMockRoom({ type: RoomType.GROUP });
		const store = useStore.getState();
		store.addRoom(room);
		store.setParticipantsAccordionStatus(room.id, false);

		setup(<ParticipantsAccordion roomId={room.id} />);
		expect(screen.queryByText(/Search Participants/i)).not.toBeVisible();
		expect(screen.getByTestId('icon: ChevronDown')).toBeInTheDocument();
	});
});
