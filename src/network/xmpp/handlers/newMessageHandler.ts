/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import {
	FasteningAction,
	MessageType,
	OperationType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { IMessagingService } from '../../../types/network/messaging/IMessagingService';
import { getTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import displayMessageBrowserNotification from '../utility/displayMessageBrowserNotification';
import displayReactionBrowserNotification from '../utility/displayReactionBrowserNotification';

export function createNewMessageHandler(
	service: IMessagingService
): (message: Element) => true {
	return function onNewMessageStanza(message: Element): true {
		if (getTagElement(message, 'result') != null) return true;

		const newMessage = decodeXMPPMessageStanza(message);
		if (!newMessage) return true;

		const store = useStore.getState();
		const sessionId: string | undefined = useStore.getState().session.id;

		store.setInboxMessages([newMessage]);
		switch (newMessage.type) {
			case MessageType.TEXT_MSG: {
				store.newMessage(newMessage);

				if (newMessage.from !== sessionId) {
					sendCustomEvent({ name: EventName.NEW_MESSAGE, data: newMessage });
					store.incrementUnreadCount(newMessage.roomId, 1);
					displayMessageBrowserNotification(newMessage);
				}

				const messageSubjectOfReplyId = newMessage.replyTo;
				if (messageSubjectOfReplyId) {
					service.requestMessageSubjectOfReply(
						newMessage.roomId,
						messageSubjectOfReplyId,
						newMessage.id
					);
				}
				break;
			}
			case MessageType.CONFIGURATION_MSG: {
				if (newMessage.operation === OperationType.MESSAGE_PIN_UPDATED) {
					const pinnedMessage = store.activeConversations[newMessage.roomId].messagePinned;
					if (pinnedMessage) {
						store.setPinnedMessage(newMessage.roomId, { ...pinnedMessage, text: newMessage.value });
					}
					return true;
				}
				store.newMessage(newMessage);
				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: newMessage });
				if (newMessage.from !== sessionId) {
					store.incrementUnreadCount(newMessage.roomId, 1);
				}
				if (newMessage.operation === OperationType.MESSAGE_PINNED) {
					service.getPinnedMessage(newMessage.roomId);
				}
				if (newMessage.operation === OperationType.MESSAGE_UNPINNED) {
					store.removePinnedMessage(newMessage.roomId);
					store.setSelectedPinnedMessage(newMessage.roomId, undefined);
				}
				if (newMessage.from === sessionId) {
					service.markAsRead(newMessage.roomId, newMessage.id);
				}
				break;
			}
			case MessageType.FASTENING: {
				store.addFastening([newMessage]);

				const lastMessage = store.chatsRegistry[newMessage.roomId]?.lastMessage;
				if (
					[FasteningAction.EDIT, FasteningAction.DELETE].includes(newMessage.action) &&
					lastMessage?.type === MessageType.TEXT_MSG &&
					newMessage.originalStanzaId === lastMessage.stanzaId
				) {
					if (newMessage.action === FasteningAction.DELETE) {
						store.setLastMessage(newMessage.roomId, {
							...lastMessage,
							deleted: true,
							text: '',
							attachment: undefined,
							replyTo: undefined
						} as TextMessage);
					}
					if (newMessage.action === FasteningAction.EDIT) {
						store.setLastMessage(newMessage.roomId, {
							...lastMessage,
							edited: true,
							text: newMessage.value ?? '',
							attachment: lastMessage.attachment
						} as TextMessage);
					}
				}
				if (newMessage.action === FasteningAction.REACTION && newMessage.from !== sessionId) {
					displayReactionBrowserNotification(newMessage);
					store.setNewReaction(
						newMessage.roomId,
						newMessage.originalStanzaId,
						newMessage.value ?? '',
						newMessage.from
					);
					if (store.activeConversations[newMessage.roomId]?.inputHasFocus) {
						setTimeout(() => {
							useStore.getState().unsetNewReactions(newMessage.roomId);
						}, 0);
					}
				}
				break;
			}
			default: {
				break;
			}
		}
		return true;
	};
}
