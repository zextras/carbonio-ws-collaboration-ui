/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Checkbox, Container, Divider, Padding, Text } from '@zextras/carbonio-design-system';
import React, { Dispatch, FC, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

type NotificationsSettingsProps = {
	desktopNotifications: boolean;
	setDesktopNotifications: Dispatch<SetStateAction<boolean>>;
};

const NotificationsSettings: FC<NotificationsSettingsProps> = ({
	desktopNotifications,
	setDesktopNotifications
}) => {
	const [t] = useTranslation();
	const sectionTitle = t('settings.notifications.title', 'Notifications');
	const sectionDescription = t(
		'settings.notifications.description',
		'Set your preferences for every type of notification in Chats.'
	);
	const notificationsCheckboxLabel = t(
		'settings.notifications.checkboxLabel',
		'Desktop notifications'
	);

	const onChangeNotificationCheckbox = (): void => {
		if (desktopNotifications) {
			setDesktopNotifications(false);
		} else {
			setDesktopNotifications(true);
		}
	};

	console.log(desktopNotifications);

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
				<Padding vertical="large"></Padding>
				<Container mainAlignment="flex-start" crossAlignment="flex-start">
					<Text overflow="break-word">{sectionDescription}</Text>
					<Padding bottom="medium" />
					<Checkbox
						defaultChecked={desktopNotifications}
						onClick={onChangeNotificationCheckbox}
						label={notificationsCheckboxLabel}
						data-testid="checkbox"
					/>
				</Container>
			</Container>
		</Container>
	);
};

export default NotificationsSettings;
