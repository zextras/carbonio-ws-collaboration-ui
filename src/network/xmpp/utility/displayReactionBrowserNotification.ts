/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, getNotificationManager, replaceHistory } from '@zextras/carbonio-shell-ui';
import { find, includes, isEmpty } from 'lodash';

import { CHATS_ROUTE } from '../../../constants/appConstants';
import useStore from '../../../store/Store';
import { MessageFastening, TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import {
	getLocalStorageItem,
	LOCAL_STORAGE_NAMES,
	NotificationsSettingsType
} from '../../../utils/localStorageUtils';
import UserDataRetriever from '../../../utils/UserDataRetriever';

const displayReactionBrowserNotification = async (message: MessageFastening): Promise<void> => {
	const store = useStore.getState();

	const room = store.rooms[message.roomId];
	const roomIsMuted = room?.userSettings?.muted;
	const isMeetingTab = !isEmpty(store.activeMeeting);
	const isOneToOneGroupMessage = includes([RoomType.ONE_TO_ONE, RoomType.GROUP], room?.type);

	const refToMyMessage = !!find(
		store.messages[message.roomId],
		(msg: TextMessage) => msg.stanzaId === message.originalStanzaId
	);

	const ChatsNotificationsSettings: NotificationsSettingsType = getLocalStorageItem(
		LOCAL_STORAGE_NAMES.NOTIFICATIONS
	);

	if (
		room &&
		!roomIsMuted &&
		((!isMeetingTab && isOneToOneGroupMessage) || (isMeetingTab && !isOneToOneGroupMessage)) &&
		ChatsNotificationsSettings.DesktopNotifications &&
		refToMyMessage &&
		message.value !== ''
	) {
		const senderName = await UserDataRetriever.getAsyncUsername(message.from);
		const senderFirstName = senderName?.split(' ')[0];
		const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;

		// TODO translation keys
		const reactWith = t('', 'Reacted to your message with:');
		const userReactWith = t('', `${senderFirstName} reacted to your message with:`, {
			senderName: senderFirstName
		});

		const textMessage =
			room.type === RoomType.ONE_TO_ONE
				? `${reactWith} ${message.value}`
				: `${userReactWith} ${message.value}`;

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

export default displayReactionBrowserNotification;
