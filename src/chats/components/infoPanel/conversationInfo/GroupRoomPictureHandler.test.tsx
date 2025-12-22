/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import GroupRoomPictureHandler from './GroupRoomPictureHandler';
import roomsApi from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const pictureUpdatedAtTime = '2022-08-25T17:24:28.961+02:00';

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

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
	id: 'room-test2',
	name: 'A Group',
	description: 'This is a beautiful description',
	pictureUpdatedAt: pictureUpdatedAtTime,
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Info.id, owner: true }),
		createMockMember({ userId: user2Info.id })
	]
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1Info.id, user1Info.name);
	store.setUserInfo([user1Info, user2Info]);
	store.addRooms([testRoom, testRoom2]);
});

describe('Room Picture Handler - groups', () => {
	test('everything should be rendered - no image', async () => {
		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom.id} />);

		const backgroundContainer = screen.getByTestId('background_container');
		await user.hover(backgroundContainer);

		const groupTitle = screen.getByText(new RegExp(`${testRoom.name}`, 'i'));
		const groupMembers = screen.getByText(/2 members/i);
		const updateButton = screen.getByTestId('upload_button');

		expect(groupTitle).toBeInTheDocument();
		expect(groupMembers).toBeInTheDocument();
		expect(updateButton).toBeInTheDocument();
	});
	test('everything should be rendered - with image', async () => {
		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom2.id} />);

		const pictureContainer = screen.getByTestId('picture_container');
		await user.hover(pictureContainer);

		const groupTitle = screen.getByText(new RegExp(`${testRoom.name}`, 'i'));
		const groupMembers = screen.getByText(/2 members/i);
		const updateButton = screen.getByTestId('upload_button');
		const deleteButton = screen.getByTestId('delete_button');

		expect(groupTitle).toBeInTheDocument();
		expect(groupMembers).toBeInTheDocument();
		expect(updateButton).toBeInTheDocument();
		expect(deleteButton).toBeInTheDocument();
	});
	test('upload an image', async () => {
		const spyOnUpdateRoomPicture = vi.spyOn(roomsApi, 'updateRoomPicture');
		const testImageFile = new File(['hello'], 'hello.png', { type: 'image/png' });

		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom.id} />);

		const backgroundContainer = screen.getByTestId('background_container');
		await user.hover(backgroundContainer);

		const hoverContainer = await screen.findByTestId('hover_container');
		const input = hoverContainer.children.item(0) as HTMLInputElement;

		expect(input).not.toBeNull();
		expect(input.files).toHaveLength(0);

		await act(async () => {
			await user.upload(input, testImageFile);
		});
		expect(input.files).toHaveLength(1);

		expect(spyOnUpdateRoomPicture).toHaveBeenCalled();
	});

	test('update an image fails', async () => {
		const spyOnUpdateRoomPicture = vi.spyOn(roomsApi, 'updateRoomPicture');
		const testImageFile = new File([new ArrayBuffer(3000)], 'hello.png', { type: 'image/png' });

		const store: RootStore = useStore.getState();
		store.setAttributes(createMockAttributesList({ carbonioWscMaxRoomPictureSize: '1' }));
		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom2.id} />);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const hoverContainer = await screen.findByTestId('hover_container');
		const input = hoverContainer.children.item(0) as HTMLInputElement;
		expect(input).not.toBeNull();

		await act(async () => {
			await user.upload(input, testImageFile);
		});
		await expect(spyOnUpdateRoomPicture).rejects.toThrowError();
	});

	test('delete an image', async () => {
		const spyOnDeleteRoomPicture = vi.spyOn(roomsApi, 'deleteRoomPicture');

		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom2.id} />);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const deleteButton = await screen.findByTestId('delete_button');
		expect(deleteButton).toBeInTheDocument();
		await user.click(deleteButton);

		const snackbar = await screen.findByText(
			/Group avatar has been successfully reset to the original one/i
		);
		expect(snackbar).toBeVisible();

		expect(spyOnDeleteRoomPicture).toHaveBeenCalled();
	});

	test('delete an image fails ', async () => {
		const spyOnDeleteRoomPicture = vi.spyOn(roomsApi, 'deleteRoomPicture');
		spyOnDeleteRoomPicture.mockRejectedValue(false);

		const { user } = setup(<GroupRoomPictureHandler roomId={testRoom2.id} />);

		const pictureContainer = await screen.findByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();

		await user.hover(pictureContainer);
		const deleteButton = await screen.findByTestId('delete_button');
		expect(deleteButton).toBeInTheDocument();
		await user.click(deleteButton);

		const snackbar = await screen.findByText(/Something went wrong. Please Retry/i);
		expect(snackbar).toBeVisible();

		expect(pictureContainer).toBeInTheDocument();
	});
});
