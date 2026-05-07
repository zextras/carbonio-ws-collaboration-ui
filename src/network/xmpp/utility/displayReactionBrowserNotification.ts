/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, getNotificationManager } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { displayChatNotification } from './displayMessageBrowserNotification';
import { CHATS_ROUTE } from '../../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MessageFastening, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { getLocalStorageItem, LOCAL_STORAGE_NAMES } from '../../../utils/localStorageUtils';
import UserDataRetriever from '../../../utils/UserDataRetriever';

const displayReactionBrowserNotification = async (message: MessageFastening): Promise<void> => {
	const store = useStore.getState();
	const room = store.rooms[message.roomId];

	const refToMyMessage = !!find(
		store.chatsRegistry[message.roomId].messages,
		(msg: TextMessage) => msg.stanzaId === message.originalStanzaId && msg.from === store.session.id
	);

	if (displayChatNotification(message.roomId) && refToMyMessage && message.value !== '') {
		const senderName = await UserDataRetriever.getAsyncUsername(message.from);
		const senderFirstName = senderName?.split(' ')[0];

		const reactWith = t('browserNotification.reaction.chat', 'Reacted to your message with:');
		const userReactWith = t(
			'browserNotification.reaction.group',
			`${senderFirstName} reacted to your message with:`,
			{ userName: senderFirstName }
		);

		const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;
		const textMessage =
			room.type === RoomType.ONE_TO_ONE
				? `${reactWith} ${message.value}`
				: `${userReactWith} ${message.value}`;

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

export default displayReactionBrowserNotification;
