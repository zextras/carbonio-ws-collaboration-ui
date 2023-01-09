/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getNotificationManager } from '@zextras/carbonio-shell-ui';

import { EventName, sendCustomEventEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { TextMessage } from '../../../types/store/MessageTypes';
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
			sendCustomEventEvent(EventName.NEW_MESSAGE);

			const store = useStore.getState();
			const sessionId: string | undefined = useStore.getState().session.id;
			store.newMessage(newMessage);
			// when I send a message as soon it's returned as Stanza we send the reads for ourselves
			if (newMessage.type === 'text' && sessionId === newMessage.from) {
				this.readMessage(newMessage.roomId, newMessage.id);
			}

			// Increment unread counter
			if (newMessage.type === 'text' && newMessage.from !== store.session.id) {
				store.incrementUnreadCount(newMessage.roomId);
			}

			// Request replied message information
			const repliedId = (newMessage as TextMessage).replyTo;
			if (repliedId) {
				this.requestRepliedMessage(newMessage.roomId, newMessage.id, repliedId);
			}

			// Display desktop notification
			const typeMessageIsPermitted = newMessage.type === 'text';
			const messageIdFromOtherUser = (newMessage as TextMessage).from !== store.session.id;
			const inputIsFocused =
				store.session.selectedRoomOneToOneGroup === newMessage.roomId &&
				store.activeConversations[newMessage.roomId].inputHasFocus;
			const room = store.rooms[newMessage.roomId];

			let notificationManager = JSON.parse(
				window.parent.localStorage.getItem('ChatsNotificationsSettings') || '{}'
			);
			if (notificationManager === '{}') {
				window.parent.localStorage.setItem(
					'ChatsNotificationsSettings',
					JSON.stringify({
						DesktopNotifications: true
					})
				);
				notificationManager = JSON.parse(
					window.parent.localStorage.getItem('ChatsNotificationsSettings') || '{}'
				);
			}

			if (
				messageIdFromOtherUser &&
				typeMessageIsPermitted &&
				!inputIsFocused &&
				room &&
				!room?.userSettings?.muted &&
				notificationManager.DesktopNotifications
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
					message: textMessage
				});
			}
		}
	}
	return true;
}
