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
	store.addRoom(groupRoom);
	store.addRoom(oneToOneRoom);
	store.setPlaceholderRoom(user1.id);
});
describe('Conversation info panel', () => {
	test('Display info panel opened', async () => {
		setup(
			<ConversationInfoPanel roomId={groupRoom.id} infoPanelOpen setInfoPanelOpen={jest.fn()} />
		);
		const conversationInfoPanel = screen.getByTestId('conversationInfoPanelOpen');
		expect(conversationInfoPanel).toBeInTheDocument();
	});

	test('Display info panel collapsed', async () => {
		setup(
			<ConversationInfoPanel
				roomId={groupRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		const conversationInfoPanelCollapsed = screen.getByTestId('conversationInfoPanelCollapsed');
		expect(conversationInfoPanelCollapsed).toBeInTheDocument();
	});

	test('Display list of participant accordion in a group room', async () => {
		setup(
			<ConversationInfoPanel
				roomId={groupRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		const participantAccordion = screen.getByTestId('participantAccordion');
		expect(participantAccordion).toBeInTheDocument();
	});

	test('Check that participant list is not present in the info panel of a one to one room', async () => {
		setup(
			<ConversationInfoPanel
				roomId={oneToOneRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		expect(screen.queryByTestId('participantAccordion')).not.toBeInTheDocument();
	});

	test('Hide action accordion when the room is a placeholder', async () => {
		setup(
			<ConversationInfoPanel
				roomId={`placeholder-${user1.id}`}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		expect(screen.queryByTestId('actionsAccordion')).not.toBeInTheDocument();
	});
});
