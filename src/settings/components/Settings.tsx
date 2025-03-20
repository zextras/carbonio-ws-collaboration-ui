/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';

import { Container, CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { SettingsHeader, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

import ChatExportSettings from './chatExporter/ChatExportSettings';
import MeetingSettings from './MeetingSettings';
import NotificationsSettings from './NotificationsSettings';
import RecordingSettings from './RecordingSettings';
import useLocalStorage from '../../hooks/useLocalStorage';
import { getAttribute } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import {
	LOCAL_STORAGE_NAMES,
	MeetingRecordingType,
	MeetingStorageType,
	NotificationsSettingsType
} from '../../utils/localStorageUtils';

const Settings: FC = () => {
	const [t] = useTranslation();
	const settingsTitle = t('settings.title', 'Chats settings');
	const saveSettingsSnackbar = t('settings.save', 'Edits saved correctly');

	const recordingEnabled = useStore((store) => getAttribute(store, 'recordingEnabled'));

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const [notificationsStorage, setNotificationsStorage] =
		useLocalStorage<NotificationsSettingsType>(LOCAL_STORAGE_NAMES.NOTIFICATIONS);
	const [meetingStorage, setMeetingStorage] = useLocalStorage<MeetingStorageType>(
		LOCAL_STORAGE_NAMES.MEETINGS
	);
	const [recordingStorage, setRecordingStorage] = useLocalStorage<MeetingRecordingType>(
		LOCAL_STORAGE_NAMES.RECORDING
	);

	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [updatedNotificationsSettings, setUpdatedNotificationsSettings] =
		useState<NotificationsSettingsType>({
			DesktopNotifications: notificationsStorage.DesktopNotifications,
			DesktopNotificationsSounds: notificationsStorage.DesktopNotificationsSounds,
			WaitingRoomAccessNotifications: notificationsStorage.WaitingRoomAccessNotifications,
			WaitingRoomAccessNotificationsSounds:
				notificationsStorage.WaitingRoomAccessNotificationsSounds
		});

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
			!isEqual(notificationsStorage, updatedNotificationsSettings) ||
			!isEqual(meetingStorage, meetingMediaDefaults) ||
			!isEqual(recordingStorage, recordingDefaults)
		) {
			setIsEnabled(true);
		} else {
			setIsEnabled(false);
		}
	}, [
		meetingMediaDefaults,
		meetingStorage,
		notificationsStorage,
		recordingDefaults,
		recordingStorage,
		updatedNotificationsSettings
	]);

	// sets all the values that has been changed to false and set the default values to the localStorage ones
	const onClose = useCallback(() => {
		setUpdatedNotificationsSettings(notificationsStorage);
		setMeetingMediaDefaults(meetingStorage);
		setRecordingStorage({ name: 'Home', id: 'LOCAL_ROOT' });
	}, [meetingStorage, notificationsStorage, setRecordingStorage]);

	const successSnackbar = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: saveSettingsSnackbar,
			hideButton: true,
			autoHideTimeout: 5000
		});
	}, [createSnackbar, saveSettingsSnackbar]);

	// saves the elements that have been modified
	const saveSettings = useCallback(() => {
		// if a user changes the notifications' settings
		if (!isEqual(notificationsStorage, updatedNotificationsSettings)) {
			setNotificationsStorage(updatedNotificationsSettings);
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
		return Promise.allSettled([Promise.resolve().then(successSnackbar)]);
	}, [
		notificationsStorage,
		updatedNotificationsSettings,
		meetingStorage,
		meetingMediaDefaults,
		recordingStorage,
		recordingDefaults,
		successSnackbar,
		setNotificationsStorage,
		setMeetingStorage,
		setRecordingStorage
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
				mainAlignment="baseline"
				crossAlignment="baseline"
				style={{ overflowY: 'auto' }}
				height="fit"
				background={'gray5'}
				padding={{ vertical: 'large', horizontal: 'medium' }}
				gap="1rem"
			>
				<NotificationsSettings
					updatedNotificationsSettings={updatedNotificationsSettings}
					setUpdatedNotificationsSettings={setUpdatedNotificationsSettings}
				/>
				<ChatExportSettings />
				<MeetingSettings
					meetingMediaDefaults={meetingMediaDefaults}
					setMeetingMediaDefaults={setMeetingMediaDefaults}
				/>
				{recordingEnabled && (
					<RecordingSettings
						recordingDefaults={recordingDefaults}
						setRecordingDefaults={setRecordingDefaults}
					/>
				)}
			</Container>
		</Container>
	);
};

export default Settings;
