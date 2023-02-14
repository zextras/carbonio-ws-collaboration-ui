/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getNotificationManager, replaceHistory } from '@zextras/carbonio-shell-ui';

import { CHATS_ROUTE_TEST } from '../../../constants/appConstants';
import { EventName, sendCustomEventEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { xmppDebug } from '../../../utils/debug';
import { decodeMessage } from '../utility/decodeMessage';
import { getTagElement } from '../utility/decodeStanza';

export function onNewMessageStanza(this: IXMPPClient, message: Element): true {
	xmppDebug(`<--- new message`);
	const resultElement = getTagElement(message, 'result');
	if (resultElement == null) {
		const newMessage = decodeMessage(message);
		if (newMessage) {
			const store = useStore.getState();
			const sessionId: string | undefined = useStore.getState().session.id;

			// Deleted Message reference
			// XMPP doesn't delete the message, so we have to
			// remove it from the store and swap with the delete tag
			if (newMessage.type === MessageType.DELETED_MSG) {
				store.setDeletedMessage(newMessage.roomId, newMessage);
			} else {
				sendCustomEventEvent(EventName.NEW_MESSAGE);
				store.newMessage(newMessage);
			}
			// when I send a message as soon it's returned as Stanza we send the reads for ourselves
			if (newMessage.type === MessageType.TEXT_MSG && sessionId === newMessage.from) {
				this.readMessage(newMessage.roomId, newMessage.id);
			}

			// Increment unread counter
			if (newMessage.type === MessageType.TEXT_MSG && newMessage.from !== store.session.id) {
				store.incrementUnreadCount(newMessage.roomId);
			}

			// Request replied message information
			const repliedId = (newMessage as TextMessage).replyTo;
			if (repliedId) {
				this.requestRepliedMessage(newMessage.roomId, newMessage.id, repliedId);
			}

			// Display desktop notification
			const typeMessageIsPermitted = newMessage.type === MessageType.TEXT_MSG;
			const messageIdFromOtherUser = (newMessage as TextMessage).from !== store.session.id;
			const inputIsFocused =
				store.session.selectedRoomOneToOneGroup === newMessage.roomId &&
				store.activeConversations[newMessage.roomId].inputHasFocus;
			const room = store.rooms[newMessage.roomId];

			let areNotificationsActive;
			const ChatsNotificationsSettings: string | null = window.parent.localStorage.getItem(
				'ChatsNotificationsSettings'
			);
			if (
				ChatsNotificationsSettings &&
				JSON.parse(ChatsNotificationsSettings).hasOwnProperty('DesktopNotifications')
			) {
				areNotificationsActive = JSON.parse(ChatsNotificationsSettings).DesktopNotifications;
			} else {
				window.parent.localStorage.setItem(
					'ChatsNotificationsSettings',
					JSON.stringify({
						DesktopNotifications: true
					})
				);
				areNotificationsActive = true;
			}

			if (
				messageIdFromOtherUser &&
				typeMessageIsPermitted &&
				!inputIsFocused &&
				room &&
				!room?.userSettings?.muted &&
				areNotificationsActive
			) {
				const sender = store.users[newMessage.from];
				const title =
					room.type === RoomType.ONE_TO_ONE ? sender.name || sender.email || '' : room.name;
				const textMessage =
					room.type === RoomType.ONE_TO_ONE
						? newMessage.text
						: `${sender?.name?.split(' ')[0]}: ${newMessage.text}`;

				getNotificationManager().notify({
					showPopup: true,
					playSound: true,
					title,
					message: textMessage,
					onClick: (): void => {
						window.focus();
						replaceHistory({
							path: `/${newMessage.roomId}`,
							route: CHATS_ROUTE_TEST
						});
					}
				});
			}
		}
	}
	return true;
}
