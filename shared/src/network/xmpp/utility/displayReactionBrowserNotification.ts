/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MessageFastening } from '../../../types/store/ChatsRegistryTypes';

// TODO
const displayReactionBrowserNotification = async (message: MessageFastening): Promise<void> => {
	// const store = sharedConfig.useStore.getState();
	// const room = store.rooms[message.roomId];
	//
	// const refToMyMessage = !!find(
	// 	store.chatsRegistry[message.roomId].messages,
	// 	(msg: TextMessage) => msg.stanzaId === message.originalStanzaId && msg.from === store.session.id
	// );
	//
	// if (displayChatNotification(message.roomId) && refToMyMessage && message.value !== '') {
	// 	const senderName = await UserDataRetriever.getAsyncUsername(message.from);
	// 	const senderFirstName = senderName?.split(' ')[0];
	//
	// 	const reactWith = t('browserNotification.reaction.chat', 'Reacted to your message with:');
	// 	const userReactWith = t(
	// 		'browserNotification.reaction.group',
	// 		`${senderFirstName} reacted to your message with:`,
	// 		{ userName: senderFirstName }
	// 	);
	//
	// 	const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;
	// 	const textMessage =
	// 		room.type === RoomType.ONE_TO_ONE
	// 			? `${reactWith} ${message.value}`
	// 			: `${userReactWith} ${message.value}`;
	//
	// 	getNotificationManager().notify({
	// 		showPopup: true,
	// 		playSound: getLocalStorageItem(LOCAL_STORAGE_NAMES.NOTIFICATIONS).DesktopNotificationsSounds,
	// 		title,
	// 		message: textMessage,
	// 		onClick: (): void => {
	// 			window.focus();
	// 			sharedConfig.sendCustomEvent({
	// 				name: EventName.ROUTE_REDIRECT,
	// 				data: {
	// 					path: `/${CHATS_ROUTE}/${message.roomId}`
	// 				}
	// 			});
	// 		}
	// 	});
	// }
};

export default displayReactionBrowserNotification;
