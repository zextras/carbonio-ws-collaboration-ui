/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getNotificationManager, replaceHistory } from '@zextras/carbonio-shell-ui';

import { CHATS_ROUTE } from '../../../constants/appConstants';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const displayMessageBrowserNotification = (message: TextMessage): void => {
	const store = useStore.getState();
	const notMyMessage = message.from !== store.session.id;
	const inputIsFocused =
		store.session.selectedRoomOneToOneGroup === message.roomId &&
		store.activeConversations[message.roomId].inputHasFocus;
	const room = store.rooms[message.roomId];
	const roomIsMuted = room?.userSettings?.muted;

	let notificationsAreActive;
	const ChatsNotificationsSettings: string | null = window.parent.localStorage.getItem(
		'ChatsNotificationsSettings'
	);
	if (
		ChatsNotificationsSettings &&
		JSON.parse(ChatsNotificationsSettings).hasOwnProperty('DesktopNotifications')
	) {
		notificationsAreActive = JSON.parse(ChatsNotificationsSettings).DesktopNotifications;
	} else {
		window.parent.localStorage.setItem(
			'ChatsNotificationsSettings',
			JSON.stringify({
				DesktopNotifications: true
			})
		);
		notificationsAreActive = true;
	}

	if (notMyMessage && !inputIsFocused && room && !roomIsMuted && notificationsAreActive) {
		const sender = store.users[message.from];
		const title = room.type === RoomType.ONE_TO_ONE ? sender.name || sender.email || '' : room.name;
		const textToDisplay = (): string => {
			const attachment = message.attachment || message.forwarded?.attachment;
			if (attachment) {
				return message.text !== '' ? message.text : attachment.name;
			}
			return message.forwarded ? message.forwarded.text : message.text;
		};

		const textMessage =
			room.type === RoomType.ONE_TO_ONE
				? textToDisplay()
				: `${(sender?.name || sender?.email)?.split(' ')[0]}: ${textToDisplay()}`;

		getNotificationManager().notify({
			showPopup: true,
			playSound: true,
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