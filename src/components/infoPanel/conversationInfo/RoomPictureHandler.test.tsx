/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockMember, createMockRoom } from '../../../tests/createMock';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';
import RoomPictureHandler from './RoomPictureHandler';

const user1Info: User = {
	id: 'myId',
	email: 'user1@domain.com',
	name: 'User 1',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
};

const user2Info: User = {
	id: 'otherId',
	email: 'user2@domain.com',
	name: 'User 2',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00',
	last_activity: 1642818965849
};

const testRoom: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user2Info.id })
	]
});

const testRoom2: RoomBe = createMockRoom({
	id: 'room-test',
	name: 'A Group',
	description: 'This is a beautiful description',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user2Info.id })
	]
});

const testRoom3: RoomBe = createMockRoom({
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Info.id }), createMockMember({ userId: user2Info.id })]
});

describe('Room Picture Handler - groups', () => {
	test('everything should be rendered - no image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const backgroundContainer = screen.getByTestId('background_container');
		await user.hover(backgroundContainer);

		const groupTitle = screen.getByText(new RegExp(`${testRoom.name}`, 'i'));
		const groupMembers = screen.getByText(/2 Participants/i);
		const updateButton = screen.getByTestId('upload_button');

		expect(groupTitle).toBeInTheDocument();
		expect(groupMembers).toBeInTheDocument();
		expect(updateButton).toBeInTheDocument();
	});
	test('everything should be rendered - with image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const pictureContainer = screen.getByTestId('picture_container');
		await user.hover(pictureContainer);

		const groupTitle = screen.getByText(new RegExp(`${testRoom.name}`, 'i'));
		const groupMembers = screen.getByText(/2 Participants/i);
		const updateButton = screen.getByTestId('upload_button');
		const deleteButton = screen.getByTestId('delete_button');

		expect(groupTitle).toBeInTheDocument();
		expect(groupMembers).toBeInTheDocument();
		expect(updateButton).toBeInTheDocument();
		expect(deleteButton).toBeInTheDocument();
	});
	test('upload an image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const backgroundContainer = screen.getByTestId('background_container');
		await user.hover(backgroundContainer);

		const uploadButton = screen.getByTestId('upload_button');
		await user.click(uploadButton);

		// Simulate ROOM_PICTURE_CHANGED WebSocket event
		act(() => store.setRoomPictureUpdated(testRoom.id, '2022-08-26T17:24:28.961+02:00'));

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const updateButton = screen.getByTestId('upload_button');
		const deleteButton = screen.getByTestId('delete_button');
		expect(updateButton).toBeInTheDocument();
		expect(deleteButton).toBeInTheDocument();
	});
	test('update an image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const updateButton = screen.getByTestId('upload_button');
		expect(updateButton).toBeInTheDocument();
		await user.click(updateButton);

		// Simulate ROOM_PICTURE_CHANGED WebSocket event
		act(() => store.setRoomPictureUpdated(testRoom.id, '2022-08-26T17:24:28.961+02:00'));

		expect(pictureContainer).toBeInTheDocument();
	});
	test('delete an image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const deleteButton = screen.getByTestId('delete_button');
		expect(deleteButton).toBeInTheDocument();
		await user.click(deleteButton);

		// Simulate ROOM_PICTURE_DELETED WebSocket event
		act(() => store.setRoomPictureDeleted(testRoom.id));

		const backgroundContainer = await screen.findByTestId('background_container');
		expect(backgroundContainer).toBeInTheDocument();

		await user.hover(backgroundContainer);
		const uploadButton = screen.getByTestId('upload_button');
		expect(uploadButton).toBeInTheDocument();
		expect(deleteButton).not.toBeInTheDocument();
	});
});

describe('Room Picture Handler - one_to_one', () => {
	test('everything should be rendered - with image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom3);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler
				roomId={testRoom3.id}
				memberId={user2Info.id}
				roomType={RoomType.ONE_TO_ONE}
			/>
		);

		// Simulate USER_PICTURE_CHANGED WebSocket event
		act(() => {
			store.setUserPictureUpdated(user2Info.id, '2022-08-25T17:24:28.961+02:00');
		});

		const pictureContainer = screen.getByTestId('picture_container');
		await user.hover(pictureContainer);

		const userName = screen.getByText(new RegExp(`${user2Info.name}`, 'i'));

		expect(userName).toBeInTheDocument();
	});
	test('label should show "Last seen" phrase if last_activity is present', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom3);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		act(() => store.setUserLastActivity(user2Info.id, 1642818617000));
		setup(
			<RoomPictureHandler
				roomId={testRoom3.id}
				memberId={user2Info.id}
				roomType={RoomType.ONE_TO_ONE}
			/>
		);

		// last activity is 2022/01/22 at 03:30:17
		expect(screen.getByText(/Last seen 01\/22\/2022/i)).toBeInTheDocument();
	});
	test('label should show ""Online', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom3);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		act(() => store.setUserPresence(user2Info.id, true));
		setup(
			<RoomPictureHandler
				roomId={testRoom3.id}
				memberId={user2Info.id}
				roomType={RoomType.ONE_TO_ONE}
			/>
		);
		expect(screen.getByTestId('user_presence_dot')).toBeInTheDocument();
	});
});
