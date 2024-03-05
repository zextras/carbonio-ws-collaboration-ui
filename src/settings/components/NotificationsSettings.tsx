/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';

import {
	Checkbox,
	Container,
	Divider,
	Padding,
	Text,
	Switch
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { NotificationsSettingsType } from '../../utils/localStorageUtils';

type NotificationsSettingsProps = {
	updatedNotificationsSettings: NotificationsSettingsType;
	setUpdatedNotificationsSettings: Dispatch<SetStateAction<NotificationsSettingsType>>;
};

const NotificationsSettings: FC<NotificationsSettingsProps> = ({
	updatedNotificationsSettings,
	setUpdatedNotificationsSettings
}) => {
	const [t] = useTranslation();
	const sectionTitle = t('settings.notifications.title', 'Notifications');
	const generalTitle = t('settings.notifications.subtitle.general', 'General');
	const waitingRoomTitle = t(
		'settings.notifications.subtitle.waitingRoom',
		'Waiting Room access notifications'
	);
	const sectionDescription = t(
		'settings.notifications.description',
		'Set your preferences for Chats notifications.'
	);
	const notificationsCheckboxLabel = t(
		'settings.notifications.checkbox.desktop',
		'Allow Desktop notifications'
	);
	const notificationsSwitchLabel = t(
		'settings.notifications.toggleSounds.desktop',
		'Enable Desktop notification sounds'
	);
	const waitingRoomCheckboxLabel = t(
		'settings.notifications.checkbox.waitingRoom',
		'Allow notifications'
	);
	const waitingRoomSwitchLabel = t(
		'settings.notifications.toggleSounds.waitingRoom',
		'Enable notification sounds'
	);

	const onChangeNotificationCheckbox = useCallback(() => {
		setUpdatedNotificationsSettings((prevState) => ({
			...prevState,
			DesktopNotifications: !prevState.DesktopNotifications
		}));
	}, [setUpdatedNotificationsSettings]);

	const onChangeNotificationSoundsSwitch = useCallback(() => {
		setUpdatedNotificationsSettings((prevState) => ({
			...prevState,
			DesktopNotificationsSounds: !prevState.DesktopNotificationsSounds
		}));
	}, [setUpdatedNotificationsSettings]);

	const onChangeWaitingRoomAccessNotificationSoundsSwitch = useCallback(() => {
		setUpdatedNotificationsSettings((prevState) => ({
			...prevState,
			WaitingRoomAccessNotificationsSounds: !prevState.WaitingRoomAccessNotificationsSounds
		}));
	}, [setUpdatedNotificationsSettings]);

	const onChangeWaitingRoomAccessNotificationCheckbox = useCallback(() => {
		setUpdatedNotificationsSettings((prevState) => ({
			...prevState,
			WaitingRoomAccessNotifications: !prevState.WaitingRoomAccessNotifications
		}));
	}, [setUpdatedNotificationsSettings]);

	return (
		<Container
			background={'gray6'}
			padding={{ horizontal: 'medium', bottom: 'medium' }}
			data-testid="notification_container"
		>
			<Container crossAlignment="flex-start">
				<Padding top="large" bottom="medium">
					<Text weight="bold">{sectionTitle}</Text>
				</Padding>
				<Divider color="gray2" />
				<Padding vertical="large">
					<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
						<Text overflow="break-word" size={'small'}>
							{sectionDescription}
						</Text>
						<Text overflow="break-word">{generalTitle}</Text>
						<Checkbox
							defaultChecked={updatedNotificationsSettings.DesktopNotifications}
							value={updatedNotificationsSettings.DesktopNotifications}
							onClick={onChangeNotificationCheckbox}
							label={notificationsCheckboxLabel}
							data-testid="desktop_notifications_checkbox"
						/>
						<Switch
							disabled={!updatedNotificationsSettings.DesktopNotifications}
							defaultChecked={updatedNotificationsSettings.DesktopNotificationsSounds}
							value={updatedNotificationsSettings.DesktopNotificationsSounds}
							onClick={onChangeNotificationSoundsSwitch}
							label={notificationsSwitchLabel}
							data-testid="desktop_notifications_sounds_switch"
						/>
						<Text overflow="break-word">{waitingRoomTitle}</Text>
						<Checkbox
							defaultChecked={updatedNotificationsSettings.WaitingRoomAccessNotifications}
							value={updatedNotificationsSettings.WaitingRoomAccessNotifications}
							onClick={onChangeWaitingRoomAccessNotificationCheckbox}
							label={waitingRoomCheckboxLabel}
							data-testid="waiting_room_access_notifications_checkbox"
						/>
						<Switch
							disabled={!updatedNotificationsSettings.WaitingRoomAccessNotifications}
							defaultChecked={updatedNotificationsSettings.WaitingRoomAccessNotificationsSounds}
							value={updatedNotificationsSettings.WaitingRoomAccessNotificationsSounds}
							onClick={onChangeWaitingRoomAccessNotificationSoundsSwitch}
							label={waitingRoomSwitchLabel}
							data-testid="waiting_room_access_sounds_switch"
						/>
					</Container>
				</Padding>
			</Container>
		</Container>
	);
};

export default NotificationsSettings;
