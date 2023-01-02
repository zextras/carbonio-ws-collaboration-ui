/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../store/Store';
import { createMockMember, createMockRoom } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import ConversationInfoPanel from './ConversationInfoPanel';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: '',
	description: 'A description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })],
	userSettings: { muted: false }
});

describe('Conversation info panel', () => {
	test('Display info panel opened', async () => {
		useStore.getState().addRoom(testRoom);
		setup(
			<ConversationInfoPanel
				roomId={testRoom.id}
				infoPanelOpen={true}
				setInfoPanelOpen={jest.fn()}
			/>
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
});
