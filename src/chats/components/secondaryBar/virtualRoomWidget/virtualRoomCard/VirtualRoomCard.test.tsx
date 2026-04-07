/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createRef } from 'react';

import { screen } from '@testing-library/react';

import VirtualRoomCard from './VirtualRoomCard';
import useStore from '../../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../../tests/createMock';
import { setup } from '../../../../../tests/test-utils';

const moreVerticalIcon = 'icon: MoreVertical';
const editVirtualRoomLabel = 'Edit Virtual Room';
const deleteVirtualRoomLabel = 'Delete Virtual Room';

const sessionUser = createMockUser({ id: 'test-user-id', name: 'Session user' });
const userOne = createMockUser({ id: 'user-one-id', name: 'User One' });
const ownerRoom = createMockRoom({
	id: 'ownerRoomId',
	meetingId: 'ownerMeetingId',
	members: [createMockMember({ userId: sessionUser.id, owner: true })]
});
const ownerMeeting = createMockMeeting({ id: 'ownerMeetingId', roomId: 'ownerRoomId' });

const ownersRoom = createMockRoom({
	id: 'ownersRoomId',
	meetingId: 'ownersMeetingId',
	members: [
		createMockMember({ userId: sessionUser.id, owner: true }),
		createMockMember({ userId: userOne.id, owner: true })
	]
});
const ownersMeeting = createMockMeeting({ id: 'ownersMeetingId', roomId: 'ownersRoomId' });

const memberRoom = createMockRoom({
	id: 'memberRoomId',
	meetingId: 'memberMeetingId',
	members: [
		createMockMember({ userId: userOne.id, owner: true }),
		createMockMember({ userId: sessionUser.id, owner: false })
	]
});
const memberMeeting = createMockMeeting({
	id: 'memberMeetingId',
	roomId: 'memberRoomId',
	participants: [createMockParticipants({ userId: sessionUser.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.setUserInfo([sessionUser, userOne]);
	store.addRooms([ownerRoom, ownersRoom, memberRoom]);
	store.addMeetings([ownerMeeting, ownersMeeting, memberMeeting]);
});

describe('VirtualRoomCard', () => {
	test('Session user is the only owner of the virtual room', () => {
		setup(<VirtualRoomCard roomId={ownerRoom.id} modalRef={createRef()} />);
		expect(screen.getByText('You')).toBeInTheDocument();
		expect(screen.getByText("You're the only moderator")).toBeInTheDocument();
	});

	test('Session user and User One are the owners of the virtual room', () => {
		setup(<VirtualRoomCard roomId={ownersRoom.id} modalRef={createRef()} />);
		expect(screen.getByText('You')).toBeInTheDocument();
		expect(screen.getByText('and other one moderator')).toBeInTheDocument();
	});

	test('User One is the only owner of the virtual room', () => {
		setup(<VirtualRoomCard roomId={memberRoom.id} modalRef={createRef()} />);
		expect(screen.getByText(userOne.name)).toBeInTheDocument();
		expect(screen.getByText('is the only moderator')).toBeInTheDocument();
	});

	test('Virtual room owner can see all the meeting buttons', async () => {
		const { user } = setup(<VirtualRoomCard roomId={ownerRoom.id} modalRef={createRef()} />);
		const actionsButtons = screen.getByTestId(moreVerticalIcon);
		await user.click(actionsButtons);
		expect(screen.getByText("Copy Virtual Room's link")).toBeInTheDocument();
		expect(screen.getByText(editVirtualRoomLabel)).toBeInTheDocument();
		expect(screen.getByText(deleteVirtualRoomLabel)).toBeInTheDocument();
	});

	test('Virtual room meeting participant can see only copy action', async () => {
		const { user } = setup(<VirtualRoomCard roomId={memberRoom.id} modalRef={createRef()} />);
		const actionsButtons = screen.getByTestId(moreVerticalIcon);
		await user.click(actionsButtons);
		expect(screen.getByText("Copy Virtual Room's link")).toBeInTheDocument();
		expect(screen.queryByText(editVirtualRoomLabel)).not.toBeInTheDocument();
		expect(screen.queryByText(deleteVirtualRoomLabel)).not.toBeInTheDocument();
	});

	test('Virtual room owner can open edit modal', async () => {
		const { user } = setup(<VirtualRoomCard roomId={ownerRoom.id} modalRef={createRef()} />);
		const actionsButtons = screen.getByTestId(moreVerticalIcon);
		await user.click(actionsButtons);

		const edit = screen.getByText(editVirtualRoomLabel);
		await user.click(edit);

		expect(screen.getByText(`Edit "${ownerRoom.name}" Virtual Room`)).toBeInTheDocument();
	});

	test('Virtual room owner can open delete modal', async () => {
		const { user } = setup(<VirtualRoomCard roomId={ownerRoom.id} modalRef={createRef()} />);
		const actionsButtons = screen.getByTestId(moreVerticalIcon);
		await user.click(actionsButtons);

		const deleteAct = screen.getByText(deleteVirtualRoomLabel);
		await user.click(deleteAct);

		expect(screen.getByText(`Delete "${ownerRoom.name}" Virtual Room`)).toBeInTheDocument();
	});
});
