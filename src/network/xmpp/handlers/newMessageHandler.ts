/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { getPinnedMessage } from '../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../store/Store';
import {
	FasteningAction,
	MessageType,
	OperationType
} from '../../../types/store/ChatsRegistryTypes';
import { getTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import displayMessageBrowserNotification from '../utility/displayMessageBrowserNotification';
import displayReactionBrowserNotification from '../utility/displayReactionBrowserNotification';

export function onNewMessageStanza(message: Element): true {
	if (getTagElement(message, 'result') != null) return true;

	const newMessage = decodeXMPPMessageStanza(message);
	if (!newMessage) return true;

	const store = useStore.getState();
	const { xmppClient } = store.connections;
	const sessionId: string | undefined = useStore.getState().session.id;

	switch (newMessage.type) {
		case MessageType.TEXT_MSG: {
			store.newMessage(newMessage);

			if (newMessage.from !== sessionId) {
				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: newMessage });
				store.incrementUnreadCount(newMessage.roomId, 1);
				displayMessageBrowserNotification(newMessage);
			}

			// Request message subject of reply
			const messageSubjectOfReplyId = newMessage.replyTo;
			if (messageSubjectOfReplyId) {
				xmppClient.requestMessageSubjectOfReply(
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
				xmppClient.getMessagePin(newMessage.roomId);
			}
			if (newMessage.operation === OperationType.MESSAGE_UNPINNED) {
				store.removePinnedMessage(newMessage.roomId);
			}
			break;
		}
		case MessageType.FASTENING: {
			store.addFastening([newMessage]);
			const pinnedMessage = getPinnedMessage(store, newMessage.roomId);
			if (
				newMessage.action === FasteningAction.DELETE &&
				pinnedMessage?.stanzaId === newMessage.originalStanzaId
			) {
				store.removePinnedMessage(newMessage.roomId);
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
}
