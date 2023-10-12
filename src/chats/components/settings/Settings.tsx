/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useEffect, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Padding,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import NotificationsSettings from './NotificationsSettings';
import ProfileSettings from './ProfileSettings';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { UsersApi } from '../../../network';

type CreateSnackbarFn = typeof CreateSnackbarFn;

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

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const [notificationsStorage, setNotificationsStorage] = useLocalStorage<{
		DesktopNotifications: boolean;
	}>('ChatsNotificationsSettings', {
		DesktopNotifications: true
	});

	const [picture, setPicture] = useState<false | File>(false);
	const [deletePicture, setDeletePicture] = useState<boolean>(false);
	const [desktopNotifications, setDesktopNotifications] = useState<boolean>(
		notificationsStorage.DesktopNotifications
	);
	const [isEnabled, setIsEnabled] = useState<boolean>(false);

	// set the isEnabled value when changed
	useEffect(() => {
		if (
			!!picture ||
			deletePicture ||
			notificationsStorage.DesktopNotifications !== desktopNotifications
		) {
			setIsEnabled(true);
		} else {
			setIsEnabled(false);
		}
	}, [deletePicture, desktopNotifications, notificationsStorage, picture]);

	// sets all the values that has been changed to false and set the default values to the localStorage ones
	const onClose = useCallback(() => {
		setPicture(false);
		setDeletePicture(false);
		setDesktopNotifications(notificationsStorage.DesktopNotifications);
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
				});
		}

		// if a user turn off/on the desktopNotifications
		if (notificationsStorage.DesktopNotifications !== desktopNotifications) {
			localStorage.setItem(
				'ChatsNotificationsSettings',
				JSON.stringify({ DesktopNotifications: desktopNotifications })
			);
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'info',
				label: saveSettingsSnackbar,
				hideButton: true,
				autoHideTimeout: 5000
			});
			setNotificationsStorage({ DesktopNotifications: desktopNotifications });
			setIsEnabled(false);
		}
	}, [
		picture,
		deletePicture,
		notificationsStorage,
		desktopNotifications,
		createSnackbar,
		saveSettingsSnackbar,
		id,
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
				/>
			</Container>
		</Container>
	);
};
export default Settings;
