/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getNotificationManager, replaceHistory } from '@zextras/carbonio-shell-ui';
import { includes, isEmpty } from 'lodash';

import { CHATS_ROUTE } from '../../../constants/appConstants';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import {
	getLocalStorageItem,
	LOCAL_STORAGE_NAMES,
	NotificationsSettingsType
} from '../../../utils/localStorageUtils';
import UserDataRetriever from '../../../utils/UserDataRetriever';

const displayMessageBrowserNotification = async (message: TextMessage): Promise<void> => {
	const store = useStore.getState();
	const notMyMessage = message.from !== store.session.id;
	const inputIsFocused =
		store.session.selectedRoomOneToOneGroup === message.roomId &&
		store.activeConversations[message.roomId].inputHasFocus;
	const room = store.rooms[message.roomId];
	const roomIsMuted = room?.userSettings?.muted;
	const isMeetingTab = !isEmpty(store.activeMeeting);
	const isOneToOneGroupMessage = includes([RoomType.ONE_TO_ONE, RoomType.GROUP], room?.type);

	const ChatsNotificationsSettings: NotificationsSettingsType = getLocalStorageItem(
		LOCAL_STORAGE_NAMES.NOTIFICATIONS
	);

	if (
		notMyMessage &&
		!inputIsFocused &&
		room &&
		!roomIsMuted &&
		((!isMeetingTab && isOneToOneGroupMessage) || (isMeetingTab && !isOneToOneGroupMessage)) &&
		ChatsNotificationsSettings.DesktopNotifications
	) {
		const senderName = await UserDataRetriever.getAsyncUsername(message.from);
		const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;
		const text = message.attachment && message.text === '' ? message.attachment.name : message.text;

		const textMessage =
			room.type === RoomType.ONE_TO_ONE ? text : `${senderName?.split(' ')[0]}: ${text}`;

		getNotificationManager().notify({
			showPopup: true,
			playSound: ChatsNotificationsSettings.DesktopNotificationsSounds,
			title,
			message: textMessage,
			onClick: (): void => {
				window.focus();
				replaceHistory({
					path: `/${message.roomId}`,
					route: CHATS_ROUTE
				});
			}
		});
	}
};

export default displayMessageBrowserNotification;
