/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getNotificationManager, IS_FOCUS_MODE } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';

import { CHATS_ROUTE } from '../../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { getLocalStorageItem, LOCAL_STORAGE_NAMES } from '../../../utils/localStorageUtils';
import UserDataRetriever from '../../../utils/UserDataRetriever';

export const displayChatNotification = (roomId: string): boolean => {
	const store = useStore.getState();
	const room = store.rooms[roomId];
	const roomIsMuted = room?.userSettings?.muted;
	const isVirtualRoom = includes([RoomType.TEMPORARY], room?.type);
	const inputIsFocused =
		store.session.selectedRoom === roomId && store.activeConversations[roomId].inputHasFocus;
	const chatsNotificationsSettingsEnabled = getLocalStorageItem(
		LOCAL_STORAGE_NAMES.NOTIFICATIONS
	)?.DesktopNotifications;

	return (
		!IS_FOCUS_MODE &&
		room &&
		!roomIsMuted &&
		!inputIsFocused &&
		!isVirtualRoom &&
		chatsNotificationsSettingsEnabled
	);
};

const displayMessageBrowserNotification = async (message: TextMessage): Promise<void> => {
	const store = useStore.getState();
	const notMyMessage = message.from !== store.session.id;
	const room = store.rooms[message.roomId];

	if (displayChatNotification(message.roomId) && notMyMessage) {
		const senderName = await UserDataRetriever.getAsyncUsername(message.from);
		const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;
		const text = message.attachment && message.text === '' ? message.attachment.name : message.text;

		const textMessage =
			room.type === RoomType.ONE_TO_ONE ? text : `${senderName?.split(' ')[0]}: ${text}`;

		getNotificationManager().notify({
			showPopup: true,
			playSound: getLocalStorageItem(LOCAL_STORAGE_NAMES.NOTIFICATIONS).DesktopNotificationsSounds,
			title,
			message: textMessage,
			onClick: (): void => {
				window.focus();
				sendCustomEvent({
					name: EventName.ROUTE_REDIRECT,
					data: {
						path: `/${CHATS_ROUTE}/${message.roomId}`
					}
				});
			}
		});
	}
};

export default displayMessageBrowserNotification;
