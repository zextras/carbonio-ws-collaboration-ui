/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';

import { Container, CreateSnackbarFn, Padding, useSnackbar } from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import NotificationsSettings from './NotificationsSettings';
import ProfileSettings from './ProfileSettings';
import useLocalStorage from '../../hooks/useLocalStorage';
import { UsersApi } from '../../network';

type SettingsProps = {
	id?: string | undefined;
};

const Settings: FC<SettingsProps> = ({ id }) => {
	const [t] = useTranslation();
	const settingsTitle = t('settings.title', 'Chats settings');
	const saveSettingsSnackbar = t('settings.save', 'Edits saved correctly');
	const errorDeleteImageSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const [notificationsStorage, setNotificationsStorage] = useLocalStorage<{
		DesktopNotifications: boolean;
		DesktopNotificationsSounds: boolean;
		WaitingRoomAccessNotifications: boolean;
		WaitingRoomAccessNotificationsSounds: boolean;
	}>('ChatsNotificationsSettings', {
		DesktopNotifications: true,
		DesktopNotificationsSounds: true,
		WaitingRoomAccessNotifications: true,
		WaitingRoomAccessNotificationsSounds: true
	});

	const [picture, setPicture] = useState<false | File>(false);
	const [deletePicture, setDeletePicture] = useState<boolean>(false);
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [desktopNotifications, setDesktopNotifications] = useState<boolean>(
		notificationsStorage.DesktopNotifications
	);
	const [desktopNotificationsSounds, setDesktopNotificationsSounds] = useState<boolean>(
		notificationsStorage.DesktopNotificationsSounds
	);
	const [waitingRoomAccessNotifications, setWaitingRoomAccessNotifications] = useState<boolean>(
		notificationsStorage.WaitingRoomAccessNotifications
	);
	const [waitingRoomAccessNotificationsSounds, setWaitingRoomAccessNotificationsSounds] =
		useState<boolean>(notificationsStorage.WaitingRoomAccessNotificationsSounds);

	// set the isEnabled value when changed
	useEffect(() => {
		if (
			!!picture ||
			deletePicture ||
			notificationsStorage.DesktopNotifications !== desktopNotifications ||
			notificationsStorage.DesktopNotificationsSounds !== desktopNotificationsSounds ||
			notificationsStorage.WaitingRoomAccessNotifications !== waitingRoomAccessNotifications ||
			notificationsStorage.WaitingRoomAccessNotificationsSounds !==
				waitingRoomAccessNotificationsSounds
		) {
			setIsEnabled(true);
		} else {
			setIsEnabled(false);
		}
	}, [
		deletePicture,
		desktopNotifications,
		desktopNotificationsSounds,
		notificationsStorage,
		picture,
		waitingRoomAccessNotifications,
		waitingRoomAccessNotificationsSounds
	]);

	// sets all the values that has been changed to false and set the default values to the localStorage ones
	const onClose = useCallback(() => {
		setPicture(false);
		setDeletePicture(false);
		setDesktopNotifications(notificationsStorage.DesktopNotifications);
		setDesktopNotificationsSounds(notificationsStorage.DesktopNotificationsSounds);
	}, [notificationsStorage]);

	// saves the elements that have been modified
	const saveSettings = useCallback(() => {
		// if a user change the picture
		if (picture) {
			UsersApi.changeUserPicture(id || '', picture)
				.then(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: saveSettingsSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					setPicture(false);
					setIsEnabled(false);
				})
				.catch(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'error',
						label: errorDeleteImageSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					return Promise.reject();
				});
		}

		// if a user delete the pictures
		if (deletePicture) {
			UsersApi.deleteUserPicture(id || '')
				.then(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'info',
						label: saveSettingsSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					setDeletePicture(false);
					setIsEnabled(false);
				})
				.catch(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						type: 'error',
						label: errorDeleteImageSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
					return Promise.reject();
				});
		}

		// if a user turn off/on the desktopNotifications
		if (
			notificationsStorage.DesktopNotifications !== desktopNotifications ||
			notificationsStorage.DesktopNotificationsSounds !== desktopNotificationsSounds ||
			notificationsStorage.WaitingRoomAccessNotifications !== waitingRoomAccessNotifications ||
			notificationsStorage.WaitingRoomAccessNotificationsSounds !==
				waitingRoomAccessNotificationsSounds
		) {
			localStorage.setItem(
				'ChatsNotificationsSettings',
				JSON.stringify({
					DesktopNotifications: desktopNotifications,
					DesktopNotificationsSounds: desktopNotificationsSounds,
					WaitingRoomAccessNotifications: waitingRoomAccessNotifications,
					WaitingRoomAccessNotificationsSounds: waitingRoomAccessNotificationsSounds
				})
			);
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'info',
				label: saveSettingsSnackbar,
				hideButton: true,
				autoHideTimeout: 5000
			});
			setNotificationsStorage({
				DesktopNotifications: desktopNotifications,
				DesktopNotificationsSounds: desktopNotificationsSounds,
				WaitingRoomAccessNotifications: waitingRoomAccessNotifications,
				WaitingRoomAccessNotificationsSounds: waitingRoomAccessNotificationsSounds
			});

			setIsEnabled(false);
		}
		return Promise.resolve();
	}, [
		picture,
		deletePicture,
		notificationsStorage.DesktopNotifications,
		notificationsStorage.DesktopNotificationsSounds,
		notificationsStorage.WaitingRoomAccessNotifications,
		notificationsStorage.WaitingRoomAccessNotificationsSounds,
		desktopNotifications,
		desktopNotificationsSounds,
		waitingRoomAccessNotifications,
		waitingRoomAccessNotificationsSounds,
		id,
		createSnackbar,
		saveSettingsSnackbar,
		errorDeleteImageSnackbar,
		setNotificationsStorage
	]);

	return (
		<Container
			mainAlignment="flex-start"
			background={'gray5'}
			style={{ overflowY: 'auto' }}
			data-testid="settings_container"
		>
			<SettingsHeader
				onSave={saveSettings}
				onCancel={onClose}
				isDirty={isEnabled}
				title={settingsTitle}
			/>
			<Container
				height="fit"
				background={'gray5'}
				padding={{ vertical: 'large', horizontal: 'medium' }}
			>
				<ProfileSettings
					picture={picture}
					setPicture={setPicture}
					sessionId={id}
					setToDelete={setDeletePicture}
					toDelete={deletePicture}
				/>
				<Padding bottom="large" />
				<NotificationsSettings
					desktopNotifications={desktopNotifications}
					setDesktopNotifications={setDesktopNotifications}
					desktopNotificationsSounds={desktopNotificationsSounds}
					setDesktopNotificationsSounds={setDesktopNotificationsSounds}
					waitingRoomAccessNotifications={waitingRoomAccessNotifications}
					setWaitingRoomAccessNotifications={setWaitingRoomAccessNotifications}
					waitingRoomAccessNotificationsSounds={waitingRoomAccessNotificationsSounds}
					setWaitingRoomAccessNotificationsSounds={setWaitingRoomAccessNotificationsSounds}
				/>
			</Container>
		</Container>
	);
};
export default Settings;
