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
import { xmppClient } from '../XMPPClient';

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

	if (!inboxMessage) return true;
	HistoryAccumulator.pushToCache(queryid, inboxMessage);

	const store = useStore.getState();
	// Handle initial unread count
	const unreadMessages = getAttribute(result, 'unread');
	if (unreadMessages && parseInt(unreadMessages, 10) > 0) {
		const unreadCount = parseInt(unreadMessages, 10);
		// Avoid to request history if the unread count is too high, to prevent performance issues
		if (unreadCount < 15) {
			xmppClient.requestHistory(
				inboxMessage.roomId,
				inboxMessage.date,
				unreadCount + 1,
				unreadCount
			);
		} else {
			store.setUnreadCount(inboxMessage.roomId, unreadCount);
		}
	}

	// Request marker to display the right read status
	if (inboxMessage.type === MessageType.TEXT_MSG && inboxMessage.from === store.session.id) {
		xmppClient.lastMarkers(inboxMessage.roomId);
	}

	return true;
}
