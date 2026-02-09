/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../../utils/dateUtils';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

/**
 * INBOX (XEP-0430)
 * Documentation: https://xmpp.org/extensions/xep-0430.html
 */

export function onInboxMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const inboxMessage = decodeXMPPMessageStanza(insideMessage, { date: dateToTimestamp(date) });
	const queryid = getRequiredAttribute(result, 'queryid');

	if (inboxMessage) {
		const store = useStore.getState();
		const { xmppClient } = store.connections;
		xmppClient.lastMarkers(inboxMessage.roomId);

		// Request history to count the real number of unread messages
		const unreadMessages = getAttribute(result, 'unread');
		if (unreadMessages && parseInt(unreadMessages, 10) > 0) {
			const unreadCount = parseInt(unreadMessages, 10);
			xmppClient.requestHistory(
				inboxMessage.roomId,
				inboxMessage.date,
				unreadCount + 1,
				unreadCount
			);
		}

		switch (inboxMessage.type) {
			case MessageType.TEXT_MSG:
				HistoryAccumulator.pushToCache(queryid, inboxMessage);

				// Request message subject of reply
				if (inboxMessage.replyTo) {
					xmppClient.requestMessageSubjectOfReply(
						inboxMessage.roomId,
						inboxMessage.replyTo,
						inboxMessage.id
					);
				}
				break;
			case MessageType.CONFIGURATION_MSG: {
				HistoryAccumulator.pushToCache(queryid, inboxMessage);
				break;
			}
			case MessageType.FASTENING:
				store.addFastening([inboxMessage]);
				// Last inboxMessage is a fastening, we need to request more messages to display the real last one
				xmppClient.requestHistory(inboxMessage.roomId, inboxMessage.date, 3);
				break;
			default:
				break;
		}
	}
	return true;
}
