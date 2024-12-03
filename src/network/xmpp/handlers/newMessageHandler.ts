/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { FasteningAction, MessageType } from '../../../types/store/MessageTypes';
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
				store.incrementUnreadCount(newMessage.roomId);
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
			store.newMessage(newMessage);
			if (newMessage.from !== sessionId) {
				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: newMessage });
				store.incrementUnreadCount(newMessage.roomId);
			}
			break;
		}
		case MessageType.FASTENING: {
			store.addFastening(newMessage);

			if (newMessage.action === FasteningAction.REACTION && newMessage.from !== sessionId) {
				displayReactionBrowserNotification(newMessage);
				store.setNewReaction(
					newMessage.roomId,
					newMessage.originalStanzaId,
					newMessage.value ?? '',
					newMessage.from
				);
			}
			break;
		}
		default: {
			break;
		}
	}
	return true;
}
