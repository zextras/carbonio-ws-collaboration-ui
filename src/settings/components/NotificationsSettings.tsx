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

type NotificationsSettingsProps = {
	desktopNotifications: boolean;
	setDesktopNotifications: Dispatch<SetStateAction<boolean>>;
	desktopNotificationsSounds: boolean;
	setDesktopNotificationsSounds: Dispatch<SetStateAction<boolean>>;
	waitingRoomAccessNotifications: boolean;
	setWaitingRoomAccessNotifications: Dispatch<SetStateAction<boolean>>;
	waitingRoomAccessNotificationsSounds: boolean;
	setWaitingRoomAccessNotificationsSounds: Dispatch<SetStateAction<boolean>>;
};

const NotificationsSettings: FC<NotificationsSettingsProps> = ({
	desktopNotifications,
	setDesktopNotifications,
	desktopNotificationsSounds,
	setDesktopNotificationsSounds,
	waitingRoomAccessNotifications,
	setWaitingRoomAccessNotifications,
	waitingRoomAccessNotificationsSounds,
	setWaitingRoomAccessNotificationsSounds
}) => {
	const [t] = useTranslation();
	const sectionTitle = t('settings.notifications.title', 'Notifications');
	const sectionDescription = t(
		'settings.notifications.description',
		'Set your preferences for Chats notifications.'
	);
	const notificationsCheckboxLabel = t(
		'settings.notifications.checkboxLabel',
		'Desktop notifications'
	);

	const onChangeNotificationCheckbox = useCallback(() => {
		if (desktopNotifications) {
			setDesktopNotifications(false);
		} else {
			setDesktopNotifications(true);
		}
	}, [desktopNotifications, setDesktopNotifications]);

	const onChangeWaitingRoomAccessNotificationSoundsSwitch = useCallback(() => {
		if (waitingRoomAccessNotificationsSounds) {
			setWaitingRoomAccessNotificationsSounds(false);
		} else {
			setWaitingRoomAccessNotificationsSounds(true);
		}
	}, [setWaitingRoomAccessNotificationsSounds, waitingRoomAccessNotificationsSounds]);

	const onChangeWaitingRoomAccessNotificationCheckbox = useCallback(() => {
		if (waitingRoomAccessNotifications) {
			setWaitingRoomAccessNotifications(false);
		} else {
			setWaitingRoomAccessNotifications(true);
		}
	}, [setWaitingRoomAccessNotifications, waitingRoomAccessNotifications]);

	const onChangeNotificationSoundsSwitch = useCallback(() => {
		if (desktopNotificationsSounds) {
			setDesktopNotificationsSounds(false);
		} else {
			setDesktopNotificationsSounds(true);
		}
	}, [desktopNotificationsSounds, setDesktopNotificationsSounds]);

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
						<Text overflow="break-word">General</Text>
						<Checkbox
							defaultChecked={desktopNotifications}
							value={desktopNotifications}
							onClick={onChangeNotificationCheckbox}
							label={notificationsCheckboxLabel}
							data-testid="checkbox"
						/>
						<Switch
							disabled={!desktopNotifications}
							defaultChecked={desktopNotificationsSounds}
							value={desktopNotificationsSounds}
							onClick={onChangeNotificationSoundsSwitch}
							label="Enable Desktop notification sounds"
							data-testid="desktop_notifications_sounds_switch"
						/>
						<Text overflow="break-word">Waiting Room access notifications</Text>
						<Checkbox
							defaultChecked={waitingRoomAccessNotifications}
							value={waitingRoomAccessNotifications}
							onClick={onChangeWaitingRoomAccessNotificationCheckbox}
							label="Allow notifications"
							data-testid="checkbox"
						/>
						<Switch
							disabled={!waitingRoomAccessNotifications}
							defaultChecked={waitingRoomAccessNotificationsSounds}
							value={waitingRoomAccessNotificationsSounds}
							onClick={onChangeWaitingRoomAccessNotificationSoundsSwitch}
							label="Enable notification sounds"
							data-testid="desktop_notifications_sounds_switch"
						/>
					</Container>
				</Padding>
			</Container>
		</Container>
	);
};

export default NotificationsSettings;
