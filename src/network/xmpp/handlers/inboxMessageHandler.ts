/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { MessageType } from '../../../types/store/ChatsRegistryTypes';
import { IMessagingService } from '../../../types/network/messaging/IMessagingService';
import { dateToTimestamp } from '../../../utils/dateUtils';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

/**
 * INBOX (XEP-0430)
 * Documentation: https://xmpp.org/extensions/xep-0430.html
 */

export function createInboxMessageHandler(
	service: IMessagingService
): (message: Element) => true {
	return function onInboxMessageStanza(message: Element): true {
		const result = getRequiredTagElement(message, 'result');
		const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
		const insideMessage = getRequiredTagElement(result, 'message');
		const inboxMessage = decodeXMPPMessageStanza(insideMessage, { date: dateToTimestamp(date) });
		const queryid = getRequiredAttribute(result, 'queryid');

		if (!inboxMessage) return true;
		HistoryAccumulator.pushToCache(queryid, inboxMessage);

		const store = useStore.getState();
		const unreadMessages = getAttribute(result, 'unread');
		if (unreadMessages && parseInt(unreadMessages, 10) > 0) {
			const unreadCount = parseInt(unreadMessages, 10);
			if (unreadCount < 15) {
				service.requestHistory(
					inboxMessage.roomId,
					inboxMessage.date,
					unreadCount + 1,
					unreadCount
				);
			} else {
				store.setUnreadCount(inboxMessage.roomId, unreadCount);
			}
		}

		if (inboxMessage.type === MessageType.TEXT_MSG && inboxMessage.from === store.session.id) {
			service.requestReadMarkers(inboxMessage.roomId);
		}

		return true;
	};
}
