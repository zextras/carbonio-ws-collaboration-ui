/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import RoomPictureHandler from './RoomPictureHandler';
import {
	mockedDeleteRoomPictureRequest,
	mockedUpdateRoomPictureRequest
} from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom
} from '../../../tests/createMock';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

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
		const testImageFile = new File(['hello'], 'hello.png', { type: 'image/png' });

		mockedUpdateRoomPictureRequest.mockReturnValueOnce('ww.url.it');
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const backgroundContainer = screen.getByTestId('background_container');
		user.hover(backgroundContainer);

		const hoverContainer = await screen.findByTestId('hover_container');
		const input = hoverContainer.children.item(0) as HTMLInputElement;

		expect(input).not.toBeNull();
		expect(input.files).toHaveLength(0);

		user.upload(input, testImageFile);
		await waitFor(() => expect(input.files).toHaveLength(1));

		const snackbar = await screen.findByText(/New avatar has been successfully uploaded/i);
		expect(snackbar).toBeVisible();

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();
	});
	test('update an image fails', async () => {
		const testImageFile = new File(['hello'], 'hello.png', { type: 'image/png' });

		mockedUpdateRoomPictureRequest.mockRejectedValueOnce('image not changed');
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

		user.hover(pictureContainer);
		const hoverContainer = await screen.findByTestId('hover_container');
		const input = hoverContainer.children.item(0) as HTMLInputElement;
		expect(input).not.toBeNull();

		user.upload(input, testImageFile);

		const snackbar = await screen.findByText(/Something went wrong/i);
		expect(snackbar).toBeVisible();
	});
	test('delete an image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);

		mockedDeleteRoomPictureRequest.mockReturnValueOnce('deleted');
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		user.hover(pictureContainer);
		const deleteButton = await screen.findByTestId('delete_button');
		expect(deleteButton).toBeInTheDocument();
		user.click(deleteButton);

		const snackbar = await screen.findByText(
			/Group avatar has been successfully reset to the original one/i
		);
		expect(snackbar).toBeVisible();

		const backgroundContainer = await screen.findByTestId('background_container');
		expect(backgroundContainer).toBeInTheDocument();

		user.hover(backgroundContainer);
		const uploadButton = await screen.findByTestId('upload_button');
		expect(uploadButton).toBeInTheDocument();
		expect(deleteButton).not.toBeInTheDocument();
	});
	test('delete an image fails ', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom2);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);

		mockedDeleteRoomPictureRequest.mockRejectedValueOnce('not deleted');
		const { user } = setup(
			<RoomPictureHandler roomId={testRoom.id} memberId="" roomType={RoomType.GROUP} />
		);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		user.hover(pictureContainer);
		const deleteButton = await screen.findByTestId('delete_button');
		expect(deleteButton).toBeInTheDocument();
		user.click(deleteButton);

		const snackbar = await screen.findByText(/Something went wrong. Please Retry/i);
		expect(snackbar).toBeVisible();

		expect(pictureContainer).toBeInTheDocument();
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
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
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
	test('label should show "Online"', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom3);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
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
