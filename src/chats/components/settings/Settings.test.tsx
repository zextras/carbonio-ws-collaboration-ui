/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import NotificationsSettings from './NotificationsSettings';
import Settings from './Settings';
import useStore from '../../../store/Store';
import { setup } from '../../../tests/test-utils';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const pictureUpdatedAtTime = '2022-08-25T17:24:28.961+02:00';

const userWithoutImage: UserBe = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const userWithImage: UserBe = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1",
	pictureUpdatedAt: pictureUpdatedAtTime
};

describe('Settings view', () => {
	test('Everything should be rendered - no image', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithoutImage);
		store.setLoginInfo(userWithoutImage.id, userWithoutImage.name, userWithoutImage.name);
		setup(<Settings id={userWithoutImage.id} />);
		const background = screen.getByTestId('background_container');
		expect(background).toBeInTheDocument();
		const uploadButton = screen.getByTestId('upload_button');
		const resetButton = screen.getByTestId('reset_button');
		expect(uploadButton).toBeInTheDocument();
		expect(resetButton).toBeInTheDocument();
		expect(resetButton).not.toBeEnabled();
	});

	test('Everything should be rendered - with image', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setUserPictureUpdated(userWithImage.id, pictureUpdatedAtTime);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(<Settings id={userWithImage.id} />);

		const background = screen.getByTestId('picture_container');
		expect(background).toBeInTheDocument();

		const uploadButton = screen.getByTestId('upload_button');
		const resetButton = screen.getByTestId('reset_button');
		expect(uploadButton).toBeInTheDocument();
		expect(resetButton).toBeInTheDocument();
		expect(resetButton).toBeEnabled();
	});

	test('Delete a profile image', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setUserPictureUpdated(userWithImage.id, pictureUpdatedAtTime);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		const { user } = setup(<Settings id={userWithImage.id} />);
		const pictureContainer = screen.getByTestId('picture_container');
		expect(pictureContainer).toBeInTheDocument();
		const resetButton = screen.getByTestId('reset_button');
		await user.click(resetButton);
		expect(pictureContainer).not.toBeInTheDocument();
		const backgroundContainer = screen.getByTestId('background_container');
		expect(backgroundContainer).toBeInTheDocument();
		expect(resetButton).not.toBeEnabled();
	});

	test('notification checkbox active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings desktopNotifications={false} setDesktopNotifications={jest.fn()} />
		);
		expect(screen.getByTestId('icon: Square')).toBeInTheDocument();
	});
	test('notification checkbox not active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(<NotificationsSettings desktopNotifications setDesktopNotifications={jest.fn()} />);
		expect(screen.getByTestId('icon: CheckmarkSquare')).toBeInTheDocument();
	});
});
