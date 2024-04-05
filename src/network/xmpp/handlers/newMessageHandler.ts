/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/MessageTypes';
import { getTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import displayMessageBrowserNotification from '../utility/displayMessageBrowserNotification';

export function onNewMessageStanza(message: Element): true {
	const resultElement = getTagElement(message, 'result');

	if (resultElement == null) {
		const newMessage = decodeXMPPMessageStanza(message);

		if (newMessage) {
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
					break;
				}
				default: {
					break;
				}
			}
		}
	}
	return true;
}
