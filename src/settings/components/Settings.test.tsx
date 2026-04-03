/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor, act } from '@testing-library/react';

import NotificationsSettings from './NotificationsSettings';
import Settings from './Settings';
import useStore from '../../store/Store';
import { createMockAttributesList, createMockUser } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { UserBe } from '../../types/network/models/userBeTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { NotificationsSettingsType } from '../../utils/localStorageUtils';

const squareIcon = 'icon: Square';

const user1: UserBe = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

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

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setUserInfo([user1]);
	store.setLoginInfo({ id: user1.id, name: user1.name, displayName: user1.name });
});
describe('Settings view', () => {
	describe('Notifications Settings', () => {
		test('desktop notification checkbox active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObject}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const checkbox = screen.getByTestId('desktop_notifications_checkbox').children[0].children[0];
			expect(checkbox).toHaveAttribute(dataTestid, 'icon: CheckmarkSquare');
		});

		test('desktop notification checkbox not active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObjectFalse}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const checkbox = screen.getByTestId('desktop_notifications_checkbox').children[0].children[0];
			expect(checkbox).toHaveAttribute(dataTestid, squareIcon);
		});

		test('desktop notification sounds switch active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObject}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const switchElement = screen.getByTestId('desktop_notifications_sounds_switch').children[0]
				.children[0];
			expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleRight');
		});

		test('desktop notification sounds switch not active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObjectFalse}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const switchElement = screen.getByTestId('desktop_notifications_sounds_switch').children[0]
				.children[0];
			expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleLeftOutline');
		});

		test('waiting room access notifications active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObject}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const checkbox = screen.getByTestId('waiting_room_access_notifications_checkbox').children[0]
				.children[0];
			expect(checkbox).toHaveAttribute(dataTestid, 'icon: CheckmarkSquare');
		});

		test('waiting room access notifications not active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObjectFalse}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const checkbox = screen.getByTestId('waiting_room_access_notifications_checkbox').children[0]
				.children[0];
			expect(checkbox).toHaveAttribute(dataTestid, squareIcon);
		});

		test('waiting room access notifications sounds active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObject}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const switchElement = screen.getByTestId('waiting_room_access_sounds_switch').children[0]
				.children[0];
			expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleRight');
		});

		test('waiting room access notifications sounds not active', async () => {
			setup(
				<NotificationsSettings
					updatedNotificationsSettings={notificationsSettingsObjectFalse}
					setUpdatedNotificationsSettings={vi.fn()}
				/>
			);
			const switchElement = screen.getByTestId('waiting_room_access_sounds_switch').children[0]
				.children[0];
			expect(switchElement).toHaveAttribute(dataTestid, 'icon: ToggleLeftOutline');
		});
	});

	describe('Meeting settings', () => {
		test('Meeting section checkboxes', () => {
			setup(<Settings />);

			const meetingContainer = screen.getByTestId('meeting_settings_container');
			expect(meetingContainer).toBeInTheDocument();

			const micCheckbox = screen.getByTestId('microphone_checkbox');
			const camCheckbox = screen.getByTestId('camera_checkbox');
			expect(micCheckbox).toBeInTheDocument();
			expect(camCheckbox).toBeInTheDocument();
		});
		test('Change meeting media settings', async () => {
			act(() => {
				localStorage.setItem(
					'ChatsMeetingSettings',
					JSON.stringify({ EnableCamera: true, EnableMicrophone: true })
				);
			});
			const store: RootStore = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'FALSE' }));
			const { user } = setup(<Settings />);

			const micCheckbox = screen.getByTestId('microphone_checkbox');
			const camCheckbox = screen.getByTestId('camera_checkbox');

			await act(() => user.click(micCheckbox));
			const micSquare = await screen.findByTestId(squareIcon);
			await waitFor(() => expect(micSquare).toBeInTheDocument());

			await act(() => user.click(camCheckbox));
			const squareIcons = await screen.findAllByTestId(squareIcon);
			await waitFor(() => expect(squareIcons).toHaveLength(2));
		});
	});

	describe('Recording settings', () => {
		test('Recording enabled', () => {
			const store: RootStore = useStore.getState();
			store.setAttributes(createMockAttributesList());
			setup(<Settings />);

			const recordingContainer = screen.getByTestId('recording_settings_container');
			expect(recordingContainer).toBeInTheDocument();
		});
		test('Meeting section with recording disabled', () => {
			const store: RootStore = useStore.getState();
			store.setAttributes(createMockAttributesList({ carbonioWscRecordingEnabled: 'FALSE' }));
			setup(<Settings />);

			const recordingContainer = screen.queryByTestId('recording_settings_container');
			expect(recordingContainer).not.toBeInTheDocument();
		});

		test('Reset recording folder', async () => {
			const store: RootStore = useStore.getState();
			store.setAttributes(createMockAttributesList());
			localStorage.setItem(
				'ChatsRecordingSettings',
				JSON.stringify({ name: 'prova', id: 'provaId' })
			);
			const { user } = setup(<Settings />);

			const resetButton = screen.getByRole('button', { name: 'Reset' });

			expect(resetButton).toBeInTheDocument();
			await act(() => user.click(resetButton));

			const folderName = await screen.findByRole('textbox', { name: 'Destination folder' });

			await waitFor(() => {
				expect(folderName).toHaveValue('Home');
			});
		});
	});
});
