/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import NotificationsSettings from './NotificationsSettings';
import Settings from './Settings';
import useStore from '../../store/Store';
import { setup } from '../../tests/test-utils';
import { UserBe } from '../../types/network/models/userBeTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { NotificationsSettingsType } from '../../utils/localStorageUtils';

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

const notificationsSettingsObject: NotificationsSettingsType = {
	DesktopNotifications: true,
	DesktopNotificationsSounds: true,
	WaitingRoomAccessNotifications: true,
	WaitingRoomAccessNotificationsSounds: true
};

const notificationsSettingsObjectFalse: NotificationsSettingsType = {
	DesktopNotifications: false,
	DesktopNotificationsSounds: false,
	WaitingRoomAccessNotifications: false,
	WaitingRoomAccessNotificationsSounds: false
};

const dataTestid = 'data-testid';

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

	test('desktop notification checkbox active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObject}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const checkbox = screen.getByTestId('desktop_notifications_checkbox').children[0].children[0];
		expect(checkbox).toHaveAttribute(dataTestid, 'icon: CheckmarkSquare');
	});

	test('desktop notification checkbox not active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObjectFalse}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const checkbox = screen.getByTestId('desktop_notifications_checkbox').children[0].children[0];
		expect(checkbox).toHaveAttribute(dataTestid, 'icon: Square');
	});

	test('desktop notification sounds switch active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObject}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const switchElement = screen.getByTestId('desktop_notifications_sounds_switch').children[0]
			.children[0];
		expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleRight');
	});

	test('desktop notification sounds switch not active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObjectFalse}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const switchElement = screen.getByTestId('desktop_notifications_sounds_switch').children[0]
			.children[0];
		expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleLeftOutline');
	});

	test('waiting room access notifications active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObject}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const checkbox = screen.getByTestId('waiting_room_access_notifications_checkbox').children[0]
			.children[0];
		expect(checkbox).toHaveAttribute(dataTestid, 'icon: CheckmarkSquare');
	});

	test('waiting room access notifications not active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObjectFalse}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const checkbox = screen.getByTestId('waiting_room_access_notifications_checkbox').children[0]
			.children[0];
		expect(checkbox).toHaveAttribute(dataTestid, 'icon: Square');
	});

	test('waiting room access notifications sounds active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObject}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const switchElement = screen.getByTestId('waiting_room_access_sounds_switch').children[0]
			.children[0];
		expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleRight');
	});

	test('waiting room access notifications sounds not active', async () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(userWithImage);
		store.setLoginInfo(userWithImage.id, userWithImage.name, userWithImage.name);
		setup(
			<NotificationsSettings
				updatedNotificationsSettings={notificationsSettingsObjectFalse}
				setUpdatedNotificationsSettings={jest.fn()}
			/>
		);
		const switchElement = screen.getByTestId('waiting_room_access_sounds_switch').children[0]
			.children[0];
		expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleLeftOutline');
	});
});
