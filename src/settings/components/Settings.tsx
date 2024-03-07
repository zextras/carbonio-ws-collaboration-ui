/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';

import { Container, CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader
} from '@zextras/carbonio-shell-ui';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import NotificationsSettings from './NotificationsSettings';
import ProfileSettings from './ProfileSettings';
import useLocalStorage from '../../hooks/useLocalStorage';
import { UsersApi } from '../../network';
import { LOCAL_STORAGE_NAMES, NotificationsSettingsType } from '../../utils/localStorageUtils';

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

	const [notificationsStorage, setNotificationsStorage] =
		useLocalStorage<NotificationsSettingsType>(LOCAL_STORAGE_NAMES.NOTIFICATIONS, {
			DesktopNotifications: true,
			DesktopNotificationsSounds: true,
			WaitingRoomAccessNotifications: true,
			WaitingRoomAccessNotificationsSounds: true
		});

	const [picture, setPicture] = useState<false | File>(false);
	const [deletePicture, setDeletePicture] = useState<boolean>(false);
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [updatedNotificationsSettings, setUpdatedNotificationsSettings] =
		useState<NotificationsSettingsType>({
			DesktopNotifications: notificationsStorage.DesktopNotifications,
			DesktopNotificationsSounds: notificationsStorage.DesktopNotificationsSounds,
			WaitingRoomAccessNotifications: notificationsStorage.WaitingRoomAccessNotifications,
			WaitingRoomAccessNotificationsSounds:
				notificationsStorage.WaitingRoomAccessNotificationsSounds
		});

	// set the isEnabled value when changed
	useEffect(() => {
		if (
			!!picture ||
			deletePicture ||
			!isEqual(notificationsStorage, updatedNotificationsSettings)
		) {
			setIsEnabled(true);
		} else {
			setIsEnabled(false);
		}
	}, [deletePicture, notificationsStorage, picture, updatedNotificationsSettings]);

	// sets all the values that has been changed to false and set the default values to the localStorage ones
	const onClose = useCallback(() => {
		setPicture(false);
		setDeletePicture(false);
		setUpdatedNotificationsSettings(notificationsStorage);
	}, [notificationsStorage]);

	const successSnackbar = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: saveSettingsSnackbar,
			hideButton: true,
			autoHideTimeout: 5000
		});
	}, [createSnackbar, saveSettingsSnackbar]);

	const errorSnackbar = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'error',
			label: errorDeleteImageSnackbar,
			hideButton: true,
			autoHideTimeout: 5000
		});
	}, [createSnackbar, errorDeleteImageSnackbar]);

	// saves the elements that have been modified
	const saveSettings = useCallback(() => {
		// if a user change the picture
		if (picture) {
			UsersApi.changeUserPicture(id || '', picture)
				.then(() => {
					setPicture(false);
					setIsEnabled(false);
				})
				.catch(() => Promise.reject().then(errorSnackbar));
		}

		// if a user delete the pictures
		if (deletePicture) {
			UsersApi.deleteUserPicture(id || '')
				.then(() => {
					setDeletePicture(false);
					setIsEnabled(false);
				})
				.catch(() => Promise.reject().then(errorSnackbar));
		}

		// if a user changes the notifications' settings
		if (!isEqual(notificationsStorage, updatedNotificationsSettings)) {
			setNotificationsStorage(updatedNotificationsSettings);
			setIsEnabled(false);
		}
		return Promise.resolve().then(successSnackbar);
	}, [
		picture,
		deletePicture,
		notificationsStorage,
		updatedNotificationsSettings,
		successSnackbar,
		id,
		errorSnackbar,
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
				gap="1rem"
			>
				<ProfileSettings
					picture={picture}
					setPicture={setPicture}
					sessionId={id}
					setToDelete={setDeletePicture}
					toDelete={deletePicture}
				/>
				<NotificationsSettings
					updatedNotificationsSettings={updatedNotificationsSettings}
					setUpdatedNotificationsSettings={setUpdatedNotificationsSettings}
				/>
			</Container>
		</Container>
	);
};
export default Settings;
