/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import ConversationInfoPanel from './ConversationInfoPanel';
import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const testRoom: RoomBe = createMockRoom({
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

describe('Conversation info panel', () => {
	test('Display info panel opened', async () => {
		useStore.getState().addRoom(testRoom);
		setup(
			<ConversationInfoPanel roomId={testRoom.id} infoPanelOpen setInfoPanelOpen={jest.fn()} />
		);
		const conversationInfoPanel = screen.getByTestId('conversationInfoPanelOpen');
		expect(conversationInfoPanel).toBeInTheDocument();
	});
	test('Display info panel collapsed', async () => {
		useStore.getState().addRoom(testRoom);
		setup(
			<ConversationInfoPanel
				roomId={testRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		const conversationInfoPanelCollapsed = screen.getByTestId('conversationInfoPanelCollapsed');
		expect(conversationInfoPanelCollapsed).toBeInTheDocument();
	});
	test('Display list of participant accordion in a group room', async () => {
		useStore.getState().addRoom(testRoom);
		setup(
			<ConversationInfoPanel
				roomId={testRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		const participantAccordion = screen.getByTestId('participantAccordion');
		expect(participantAccordion).toBeInTheDocument();
	});
	test('Check that participant list is not present in the info panel of a one to one room', async () => {
		useStore.getState().addRoom(oneToOneRoom);
		setup(
			<ConversationInfoPanel
				roomId={oneToOneRoom.id}
				infoPanelOpen={false}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		expect(screen.queryByTestId('participantAccordion')).not.toBeInTheDocument();
	});
});
