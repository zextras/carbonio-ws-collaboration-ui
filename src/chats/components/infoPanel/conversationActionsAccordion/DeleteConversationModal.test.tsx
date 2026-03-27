/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import DeleteConversationModal from './DeleteConversationModal';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

const memberOne = createMockMember({ userId: 'myId' });
const memberTwo = createMockMember({ userId: 'userTwo' });
const deleteGroupOngoingMeeting =
	'There is currently an active meeting. Deleting the Group will end the meeting without any warning.This action will affect all Group members and cannot be undone. Are you sure you want to delete this Group?';

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	type: RoomType.GROUP,
	members: [memberOne, memberTwo]
});

const testMeeting: MeetingBe = createMockMeeting({
	roomId: testRoom.id,
	participants: [
		createMockParticipants({ userId: memberOne.userId }),
		createMockParticipants({ userId: memberTwo.userId })
	]
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([testRoom]);
	store.addMeetings([testMeeting]);
});

describe('Delete Conversation Modal', () => {
	test('all elements should be rendered - one member', () => {
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={vi.fn()}
				closeModal={vi.fn()}
				type={RoomType.GROUP}
				numberOfMembers={1}
				roomId={testRoom.id}
			/>
		);
		const title = screen.getByText(/Leave and Delete Group/i);
		expect(title).toBeInTheDocument();
	});
	test('all elements should be rendered - more members', () => {
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={vi.fn()}
				closeModal={vi.fn()}
				type={RoomType.GROUP}
				numberOfMembers={2}
				roomId={testRoom.id}
			/>
		);
		const title = screen.getByText(/Delete Group/i);
		expect(title).toBeInTheDocument();
	});
	test('Display alert for ongoing meeting when user open modal to delete the group', () => {
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={vi.fn()}
				closeModal={vi.fn()}
				type={RoomType.GROUP}
				numberOfMembers={2}
				roomId={testRoom.id}
			/>
		);
		const title = screen.getByText(deleteGroupOngoingMeeting);
		expect(title).toBeInTheDocument();
	});
	test('Display alert for ongoing meeting when user open modal to delete the group', () => {
		setup(
			<DeleteConversationModal
				deleteConversationModalOpen
				deleteConversation={vi.fn()}
				closeModal={vi.fn()}
				type={RoomType.GROUP}
				numberOfMembers={2}
				roomId={testRoom.id}
			/>
		);
		const title = screen.getByText(/Delete Group/i);
		expect(title).toBeInTheDocument();
	});
});
