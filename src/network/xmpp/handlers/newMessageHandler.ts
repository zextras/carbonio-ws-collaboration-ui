/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { MessageType } from '../../../types/store/MessageTypes';
import { xmppDebug } from '../../../utils/debug';
import { getTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import displayMessageBrowserNotification from '../utility/displayMessageBrowserNotification';

export function onNewMessageStanza(this: IXMPPClient, message: Element): true {
	xmppDebug(`<--- new message`);
	const resultElement = getTagElement(message, 'result');
	if (resultElement == null) {
		const newMessage = decodeXMPPMessageStanza(message);
		if (newMessage) {
			const store = useStore.getState();
			const sessionId: string | undefined = useStore.getState().session.id;

			switch (newMessage.type) {
				case MessageType.TEXT_MSG: {
					store.newMessage(newMessage);

					if (newMessage.from === sessionId) {
						// Set my message as read
						this.readMessage(newMessage.roomId, newMessage.id);
					} else {
						sendCustomEvent({ name: EventName.NEW_MESSAGE, data: newMessage });
						displayMessageBrowserNotification(newMessage);
						store.incrementUnreadCount(newMessage.roomId);
					}

					// Request message subject of reply
					const messageSubjectOfReplyId = newMessage.replyTo;
					if (messageSubjectOfReplyId) {
						this.requestMessageSubjectOfReply(
							newMessage.roomId,
							messageSubjectOfReplyId,
							newMessage.id
						);
					}
					break;
				}
				case MessageType.CONFIGURATION_MSG: {
					store.newMessage(newMessage);
					if (newMessage.from === sessionId) {
						this.readMessage(newMessage.roomId, newMessage.id);
					} else {
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
