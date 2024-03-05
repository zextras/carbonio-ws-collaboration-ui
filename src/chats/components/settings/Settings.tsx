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
	SettingsHeader,
	useIntegratedFunction
} from '@zextras/carbonio-shell-ui';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import NotificationsSettings from './NotificationsSettings';
import ProfileSettings from './ProfileSettings';
import useLocalStorage from '../../../hooks/useLocalStorage';
import MeetingSettings from '../../../MeetingSettings';
import { UsersApi } from '../../../network';
import { MeetingRecordingType, MeetingStorageType } from '../../../types/generics';

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
	}>('ChatsNotificationsSettings', {
		DesktopNotifications: true
	});
	const [meetingStorage, setMeetingStorage] = useLocalStorage<MeetingStorageType>(
		'ChatsMeetingSettings',
		{
			EnableMicrophone: true,
			EnableCamera: true
		}
	);
	const [recordingStorage, setRecordingStorage] = useLocalStorage<MeetingRecordingType>(
		'ChatsRecordingSettings',
		{
			name: 'Home',
			id: 'LOCAL_ROOT'
		}
	);

	const [picture, setPicture] = useState<false | File>(false);
	const [deletePicture, setDeletePicture] = useState<boolean>(false);
	const [desktopNotifications, setDesktopNotifications] = useState<boolean>(
		notificationsStorage.DesktopNotifications
	);
	const [isEnabled, setIsEnabled] = useState<boolean>(false);

	const [meetingMediaDefaults, setMeetingMediaDefaults] = useState<MeetingStorageType>({
		EnableMicrophone: meetingStorage.EnableMicrophone,
		EnableCamera: meetingStorage.EnableCamera
	});
	const [recordingDefaults, setRecordingDefaults] = useState<MeetingRecordingType>({
		name: recordingStorage.name,
		id: recordingStorage.id
	});

	const [getNode, getNodeAvailable] = useIntegratedFunction('get-node');

	useEffect(() => {
		if (recordingStorage && getNodeAvailable) {
			getNode(recordingStorage.id).then((result: { rootId: string }) => {
				if (result.rootId === 'TRASH_ROOT') {
					setRecordingStorage({ name: 'Home', id: 'LOCAL_ROOT' });
					setRecordingDefaults({ name: 'Home', id: 'LOCAL_ROOT' });
				}
			});
		}
	}, [getNode, getNodeAvailable, recordingStorage, setRecordingStorage]);

	// set the isEnabled value when changed
	useEffect(() => {
		if (
			!!picture ||
			deletePicture ||
			notificationsStorage.DesktopNotifications !== desktopNotifications ||
			!isEqual(meetingStorage, meetingMediaDefaults) ||
			!isEqual(recordingStorage, recordingDefaults)
		) {
			setIsEnabled(true);
		} else {
			setIsEnabled(false);
		}
	}, [
		deletePicture,
		desktopNotifications,
		meetingMediaDefaults,
		meetingStorage,
		notificationsStorage.DesktopNotifications,
		picture,
		recordingDefaults,
		recordingStorage
	]);

	// sets all the values that has been changed to false and set the default values to the localStorage ones
	const onClose = useCallback(() => {
		setPicture(false);
		setDeletePicture(false);
		setDesktopNotifications(notificationsStorage.DesktopNotifications);
		setMeetingMediaDefaults(meetingStorage);
		setRecordingStorage({ name: 'Home', id: 'LOCAL_ROOT' });
	}, [meetingStorage, notificationsStorage.DesktopNotifications, setRecordingStorage]);

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

		// if a user changes his media default for meetings
		if (!isEqual(meetingStorage, meetingMediaDefaults)) {
			setMeetingStorage(meetingMediaDefaults);
			setIsEnabled(false);
		}

		// if a user changes his recording folder
		if (!isEqual(recordingStorage, recordingDefaults)) {
			setRecordingStorage(recordingDefaults);
			setIsEnabled(false);
		}

		return Promise.resolve();
	}, [
		picture,
		deletePicture,
		notificationsStorage.DesktopNotifications,
		desktopNotifications,
		meetingStorage,
		meetingMediaDefaults,
		recordingStorage,
		recordingDefaults,
		id,
		createSnackbar,
		saveSettingsSnackbar,
		errorDeleteImageSnackbar,
		setNotificationsStorage,
		setMeetingStorage,
		setRecordingStorage
	]);

	return (
		<Container data-testid="settings_container">
			<SettingsHeader
				onSave={saveSettings}
				onCancel={onClose}
				isDirty={isEnabled}
				title={settingsTitle}
			/>
			<Container
				mainAlignment="baseline"
				crossAlignment="baseline"
				style={{ overflowY: 'auto' }}
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
				<Padding bottom="large" />
				<MeetingSettings
					meetingMediaDefaults={meetingMediaDefaults}
					setMeetingMediaDefaults={setMeetingMediaDefaults}
					recordingDefaults={recordingDefaults}
					setRecordingDefaults={setRecordingDefaults}
				/>
			</Container>
		</Container>
	);
};

export default Settings;
