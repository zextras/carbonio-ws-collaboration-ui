/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import DeleteConversationModal from './DeleteConversationModal';
import useStore from '../../../../store/Store';
import { createMockMember, createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	type: RoomType.GROUP,
	members: [createMockMember({ userId: 'myId' })]
});

describe('Delete Conversation Modal', () => {
	test('all elements should be rendered - one member', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={jest.fn()}
				closeModal={jest.fn()}
				type={RoomType.GROUP}
				numberOfMembers={1}
			/>
		);
		const title = screen.getByText(/Leave and Delete Group/i);
		expect(title).toBeInTheDocument();
	});
	test('all elements should be rendered - more members', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={jest.fn()}
				closeModal={jest.fn()}
				type={RoomType.GROUP}
				numberOfMembers={2}
			/>
		);
		const title = screen.getByText(/Delete Group/i);
		expect(title).toBeInTheDocument();
	});
});
