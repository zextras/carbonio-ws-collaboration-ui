/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export enum LOCAL_STORAGE_NAMES {
	NOTIFICATIONS = 'ChatsSettingsNotifications'
}

export type NotificationsSettingsType = {
	DesktopNotifications: boolean;
	DesktopNotificationsSounds: boolean;
	WaitingRoomAccessNotifications: boolean;
	WaitingRoomAccessNotificationsSounds: boolean;
};
export const getLocalStorageItem = (
	localStorageName: LOCAL_STORAGE_NAMES
): NotificationsSettingsType => {
	const storage = window.parent.localStorage.getItem(localStorageName);
	if (storage) {
		return JSON.parse(storage);
	}
	window.parent.localStorage.setItem(
		localStorageName,
		JSON.stringify({
			DesktopNotifications: true,
			DesktopNotificationsSounds: true,
			WaitingRoomAccessNotifications: true,
			WaitingRoomAccessNotificationsSounds: true
		})
	);
	return JSON.parse(window.parent.localStorage.getItem(localStorageName)!);
};
