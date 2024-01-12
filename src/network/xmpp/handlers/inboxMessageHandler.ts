/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/MessageTypes';
import { dateToTimestamp, now } from '../../../utils/dateUtils';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';

/**
 * INBOX (XEP-0430)
 * Documentation: https://xmpp.org/extensions/xep-0430.html
 */

export function onInboxMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const inboxMessage = decodeXMPPMessageStanza(insideMessage, { date: dateToTimestamp(date) });
	const sessionId = useStore.getState().session.id;

	if (inboxMessage) {
		const unreadMessagesOfSingleConversation = getRequiredAttribute(result, 'unread');
		const store = useStore.getState();
		const { xmppClient } = store.connections;
		store.addUnreadCount(inboxMessage.roomId, parseInt(unreadMessagesOfSingleConversation, 10));

		switch (inboxMessage.type) {
			case MessageType.TEXT_MSG:
				store.newInboxMessage(inboxMessage);

				// Request message subject of reply
				if (inboxMessage.replyTo) {
					xmppClient.requestMessageSubjectOfReply(
						inboxMessage.roomId,
						inboxMessage.replyTo,
						inboxMessage.id
					);
				}

				// Ask smart markers to update Check icon
				if (inboxMessage.from === sessionId) {
					xmppClient.lastMarkers(inboxMessage.roomId);
				}
				break;
			case MessageType.CONFIGURATION_MSG: {
				store.newInboxMessage(inboxMessage);
				break;
			}
			case MessageType.FASTENING:
				store.addFastening(inboxMessage);
				// Last inboxMessage is a fastening, we need to request more messages to display the real last one
				xmppClient.requestHistory(inboxMessage.roomId, now(), 3);
				break;
			default:
				break;
		}
	}
	return true;
}

export function onGetInboxResponse(stanza: Element): true {
	return true;
}

export function onSetInboxResponse(stanza: Element): true {
	return true;
}
