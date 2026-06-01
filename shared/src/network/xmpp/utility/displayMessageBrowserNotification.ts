/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TextMessage } from '../../../types/store/ChatsRegistryTypes';

export const displayChatNotification = (roomId: string): boolean =>
	// const store = sharedConfig.useStore.getState();
	// const room = store.rooms[roomId];
	// const roomIsMuted = room?.userSettings?.muted;
	// const isVirtualRoom = includes([RoomType.TEMPORARY], room?.type);
	// const inputIsFocused =
	// 	store.session.selectedRoom === roomId && store.activeConversations[roomId].inputHasFocus;
	// const chatsNotificationsSettingsEnabled = getLocalStorageItem(
	// 	LOCAL_STORAGE_NAMES.NOTIFICATIONS
	// )?.DesktopNotifications;
	//
	// return (
	// 	!IS_FOCUS_MODE &&
	// 	room &&
	// 	!roomIsMuted &&
	// 	!inputIsFocused &&
	// 	!isVirtualRoom &&
	// 	chatsNotificationsSettingsEnabled
	// );
	true;

const displayMessageBrowserNotification = async (message: TextMessage): Promise<void> => {
	// const store = sharedConfig.useStore.getState();
	// const notMyMessage = message.from !== store.session.id;
	// const room = store.rooms[message.roomId];
	//
	// if (displayChatNotification(message.roomId) && notMyMessage) {
	// 	const senderName = await UserDataRetriever.getAsyncUsername(message.from);
	// 	const title = room.type === RoomType.ONE_TO_ONE ? senderName || '' : room.name;
	// 	const text = message.attachment && message.text === '' ? message.attachment.name : message.text;
	//
	// 	const textMessage =
	// 		room.type === RoomType.ONE_TO_ONE ? text : `${senderName?.split(' ')[0]}: ${text}`;
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

export default displayMessageBrowserNotification;
