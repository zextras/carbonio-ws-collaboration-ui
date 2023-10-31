/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import LeaveConversationModal from './LeaveConversationModal';
import useStore from '../../../../store/Store';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

describe('Leave Conversation', () => {
	test('Leave modal should be visible', async () => {
		const room: RoomBe = {
			id: 'Room-Id',
			name: 'Room Name',
			description: 'This is the description of the group',
			type: RoomType.GROUP,
			createdAt: '1234567',
			updatedAt: '12345678',
			pictureUpdatedAt: '123456789'
		};
		const leaveConversationMock = jest.fn();
		const closeModalMock = jest.fn();

		useStore.getState().addRoom(room);
		setup(
			<LeaveConversationModal
				leaveConversation={leaveConversationMock}
				leaveConversationModalOpen
				closeModal={closeModalMock}
				roomType="group"
			/>
		);
		const modalTitle = screen.getByText(/Leave Group/i);
		expect(modalTitle).toBeInTheDocument();
	});
});
