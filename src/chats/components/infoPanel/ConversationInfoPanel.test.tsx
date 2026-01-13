/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ConversationInfoPanel from './ConversationInfoPanel';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom, createMockUser } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

const oneToOneRoom: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: 'myId' })]
});

const user1 = createMockUser({ id: 'user1Id', name: 'User 1' });

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([oneToOneRoom, groupRoom]);
	store.setPlaceholderRoom(user1.id);
});

describe('Conversation info panel', () => {
	test('Display list of participant accordion in a group room', async () => {
		setup(<ConversationInfoPanel roomId={groupRoom.id} goToChatView={vi.fn()} />);
		const participantAccordion = screen.getByTestId('participantAccordion');
		expect(participantAccordion).toBeInTheDocument();
	});

	test('Check that participant list is not present in the info panel of a one to one room', async () => {
		setup(<ConversationInfoPanel roomId={oneToOneRoom.id} goToChatView={vi.fn()} />);
		expect(screen.queryByTestId('participantAccordion')).not.toBeInTheDocument();
	});

	test('Hide action accordion when the room is a placeholder', async () => {
		setup(<ConversationInfoPanel roomId={`placeholder-${user1.id}`} goToChatView={vi.fn()} />);
		expect(screen.queryByTestId('actionsAccordion')).not.toBeInTheDocument();
	});
});
