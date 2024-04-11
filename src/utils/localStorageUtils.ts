/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export enum LOCAL_STORAGE_NAMES {
	NOTIFICATIONS = 'ChatsSettingsNotifications',
	MEETINGS = 'ChatsMeetingSettings',
	RECORDING = 'ChatsRecordingSettings'
}

export type NotificationsSettingsType = {
	DesktopNotifications: boolean;
	DesktopNotificationsSounds: boolean;
	WaitingRoomAccessNotifications: boolean;
	WaitingRoomAccessNotificationsSounds: boolean;
};

export type MeetingStorageType = {
	EnableMicrophone: boolean;
	EnableCamera: boolean;
};

export type MeetingRecordingType = { name: string; id: string };

export type LocalStorageType = NotificationsSettingsType &
	MeetingStorageType &
	MeetingRecordingType;

export const getLocalStorageItem = (localStorageName: LOCAL_STORAGE_NAMES): LocalStorageType => {
	const storage = window.parent.localStorage.getItem(localStorageName);
	if (storage) {
		return JSON.parse(storage);
	}
	// eslint-disable-next-line default-case
	switch (localStorageName) {
		case LOCAL_STORAGE_NAMES.NOTIFICATIONS:
			window.parent.localStorage.setItem(
				localStorageName,
				JSON.stringify({
					DesktopNotifications: true,
					DesktopNotificationsSounds: true,
					WaitingRoomAccessNotifications: true,
					WaitingRoomAccessNotificationsSounds: true
				})
			);
			break;
		case LOCAL_STORAGE_NAMES.MEETINGS:
			window.parent.localStorage.setItem(
				localStorageName,
				JSON.stringify({
					EnableMicrophone: true,
					EnableCamera: true
				})
			);
			break;
		case LOCAL_STORAGE_NAMES.RECORDING:
			window.parent.localStorage.setItem(
				localStorageName,
				JSON.stringify({
					name: 'Home',
					id: 'LOCAL_ROOT'
				})
			);
			break;
	}
	return JSON.parse(window.parent.localStorage.getItem(localStorageName)!);
};
