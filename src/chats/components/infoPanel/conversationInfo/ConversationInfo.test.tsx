/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ConversationInfo from './ConversationInfo';
import ConversationInfoDetails from './ConversationInfoDetails';
import useStore from '../../../../store/Store';
import { mockedGetUserPictureRequest } from '../../../../tests/mocks/network';
import { mockUseMediaQueryCheck } from '../../../../tests/mocks/useMediaQueryCheck';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';

const user1Be: UserBe = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const room = {
	id: 'Room-Id',
	name: 'Room Name',
	description: 'This is the description of the group',
	type: RoomType.GROUP,
	createdAt: '1234567',
	updatedAt: '12345678',
	pictureUpdatedAt: '123456789',
	members: [
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
		},
		{
			userId: 'user3',
			owner: false,
			temporary: false,
			external: false
		}
	]
};

const OneToOneRoom: RoomBe = {
	id: 'One-To-One-Room-Id',
	name: ' ',
	description: '',
	type: RoomType.ONE_TO_ONE,
	createdAt: '1234567',
	updatedAt: '12345678',
	pictureUpdatedAt: '123456789',
	members: [
		{
			userId: 'user1',
			owner: true,
			temporary: false,
			external: false
		}
	]
};

const ImageBlob = {
	size: undefined,
	type: 'basic'
};

describe('Conversation info Details', () => {
	test('group info should appear as expected', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		setup(<ConversationInfoDetails roomId={room.id} roomType="group" />);
		expect(screen.getByText(room.description)).toBeInTheDocument();
		act(() => store.setRoomDescription(room.id, 'new description'));
		expect(screen.getByText(/new description/i)).toBeInTheDocument();
	});
	test('user info should appear as expected', async () => {
		const store = useStore.getState();
		store.addRoom(OneToOneRoom);
		store.setUserInfo(user1Be);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		setup(<ConversationInfoDetails roomId={OneToOneRoom.id} roomType={RoomType.ONE_TO_ONE} />);
		expect(screen.getAllByText(user1Be.name)).toHaveLength(1);
		expect(screen.getByText(user1Be.email)).toBeInTheDocument();
		if (user1Be.statusMessage != null) {
			expect(screen.getByText(user1Be.statusMessage)).toBeInTheDocument();
		}
		act(() => store.setUserStatusMessage(user1Be.id, 'new status message'));
		expect(screen.getByText(/new status message/i)).toBeInTheDocument();
	});
});

describe('Conversation Info', () => {
	test('user info should appear as expected', async () => {
		const store = useStore.getState();
		store.addRoom(OneToOneRoom);
		store.setUserInfo(user1Be);
		mockedGetUserPictureRequest.mockReturnValueOnce(ImageBlob);
		setup(
			<ConversationInfo
				roomId={OneToOneRoom.id}
				roomType={RoomType.ONE_TO_ONE}
				setInfoPanelOpen={jest.fn()}
			/>
		);
		expect(screen.getAllByText(user1Be.name)).toHaveLength(1);
	});
	test('group info should appear as expected', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(
			<ConversationInfo roomId={room.id} roomType={RoomType.GROUP} setInfoPanelOpen={jest.fn()} />
		);
		expect(screen.getByText(room.name)).toBeInTheDocument();
	});
	test('infoPanel take all space', async () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<ConversationInfo roomId={room.id} roomType="group" setInfoPanelOpen={jest.fn()} />);
		const messagesIcon = screen.getByTestId('icon: MessageCircleOutline');
		expect(messagesIcon).toBeInTheDocument();
	});
	test('infoPanel does not take all space', async () => {
		mockUseMediaQueryCheck.mockReturnValueOnce(true);
		const store = useStore.getState();
		store.addRoom(room);
		setup(<ConversationInfo roomId={room.id} roomType="group" setInfoPanelOpen={jest.fn()} />);
		expect(screen.queryByTestId('icon: MessageCircleOutline')).toBeNull();
	});
});
