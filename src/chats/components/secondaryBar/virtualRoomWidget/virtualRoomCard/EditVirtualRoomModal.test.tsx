/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { createRef } from 'react';

import { screen, within } from '@testing-library/react';

import EditVirtualRoomModal from './EditVirtualRoomModal';
import useStore from '../../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../../../tests/mocks/network';
import { mockSearchUsersByFeatureRequest } from '../../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../../tests/test-utils';
import { RoomType } from '../../../../../types/network/models/roomBeTypes';
import { ContactInfo } from '../../../../../types/network/soap/searchUsersByFeatureRequest';

const user1: ContactInfo = {
	email: 'user1@test.com',
	displayName: 'User One',
	id: 'user1-id'
};

const user2: ContactInfo = {
	email: 'user2@test.com',
	displayName: 'User Two',
	id: 'user2-id'
};

const member1 = createMockUser({ id: user1.id });

const virtualRoom = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: member1.id, owner: true })],
	meetingId: 'meeting-id'
});

const meeting = createMockMeeting({ roomId: virtualRoom.id });

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([virtualRoom]);
	store.addMeetings([meeting]);
	store.setUserInfo([member1]);
	mockSearchUsersByFeatureRequest.mockResolvedValueOnce({ contacts: [user1, user2] });
});
describe('EditVirtualRoomModal test', () => {
	test('Initial modal rendering', async () => {
		setup(
			<EditVirtualRoomModal
				showModal
				setShowModal={jest.fn()}
				modalRef={createRef}
				roomId={virtualRoom.id}
			/>
		);
		expect(await screen.findByTestId('list_contacts')).toBeInTheDocument();

		expect(screen.getByText(`Edit "${virtualRoom.name}" Virtual Room`)).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Virtual Room’s name*' })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Virtual Room’s moderators' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
	});

	test('Edit only the name', async () => {
		const spyOnUpdateRoom = spyOnRoomsApi(RoomsApiToSpy.UPDATE_ROOM);
		const { user } = setup(
			<EditVirtualRoomModal
				showModal
				setShowModal={jest.fn()}
				modalRef={createRef}
				roomId={virtualRoom.id}
			/>
		);
		const nameInput = screen.getByRole('textbox', { name: 'Virtual Room’s name*' });
		await user.type(nameInput, 'New Name');
		await user.click(screen.getByRole('button', { name: 'Edit' }));
		expect(spyOnUpdateRoom).toHaveBeenCalled();
	});

	test('Add a new moderators', async () => {
		const spyOnAddMembers = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM_MEMBERS);
		const { user } = setup(
			<EditVirtualRoomModal
				showModal
				setShowModal={jest.fn()}
				modalRef={createRef}
				roomId={virtualRoom.id}
			/>
		);
		const listUser = await within(await screen.findByTestId('list_contacts')).findByText(
			user2.displayName
		);
		await user.click(listUser);
		await user.click(screen.getByRole('button', { name: 'Edit' }));
		expect(spyOnAddMembers).toHaveBeenCalled();
	});

	test('Remove an old moderator', async () => {
		const spyOnDeleteMembers = spyOnRoomsApi(RoomsApiToSpy.DELETE_ROOM_MEMBER);
		const { user } = setup(
			<EditVirtualRoomModal
				showModal
				setShowModal={jest.fn()}
				modalRef={createRef}
				roomId={virtualRoom.id}
			/>
		);
		const listUser = await within(await screen.findByTestId('list_contacts')).findByText(
			user1.displayName
		);
		await user.click(listUser);
		await user.click(screen.getByRole('button', { name: 'Edit' }));
		expect(spyOnDeleteMembers).toHaveBeenCalled();
	});

	test('Edit moderators while they are meeting participants', async () => {
		const store = useStore.getState();
		store.addParticipant(meeting.id, createMockParticipants({ userId: member1.id }));
		store.addParticipant(meeting.id, createMockParticipants({ userId: user2.id }));
		const spyUpdateOwners = spyOnRoomsApi(RoomsApiToSpy.UPDATE_ROOM_OWNERS);
		const { user } = setup(
			<EditVirtualRoomModal
				showModal
				setShowModal={jest.fn()}
				modalRef={createRef}
				roomId={virtualRoom.id}
			/>
		);

		const listUser1 = await within(await screen.findByTestId('list_contacts')).findByText(
			user1.displayName
		);
		await user.click(listUser1);

		const listUser2 = await within(await screen.findByTestId('list_contacts')).findByText(
			user2.displayName
		);
		await user.click(listUser2);

		await user.click(screen.getByRole('button', { name: 'Edit' }));
		expect(spyUpdateOwners).toHaveBeenCalled();
	});
});
