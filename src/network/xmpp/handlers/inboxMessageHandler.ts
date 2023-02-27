/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { dateToTimestamp, now } from '../../../utils/dateUtil';
import { xmppDebug } from '../../../utils/debug';
import { decodeMessage } from '../utility/decodeMessage';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';

/**
 * INBOX (XEP-0430)
 * Documentation: https://xmpp.org/extensions/xep-0430.html
 */

export function onInboxMessageStanza(this: IXMPPClient, message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const inboxMessage = decodeMessage(insideMessage, { date: dateToTimestamp(date) });
	const sessionId = useStore.getState().session.id;
	console.log(message);
	if (inboxMessage) {
		const unreadMessagesOfSingleConversation = getRequiredAttribute(result, 'unread');
		const store = useStore.getState();
		store.newInboxMessage(inboxMessage);
		store.addUnreadCount(inboxMessage.roomId, parseInt(unreadMessagesOfSingleConversation, 10));

		// Last inboxMessage is a retraction/correction, we need to request more messages to display the real last one
		if (
			inboxMessage.type === MessageType.DELETED_MSG ||
			(inboxMessage.type === MessageType.TEXT_MSG && inboxMessage.edited)
		) {
			this.requestHistory(inboxMessage.roomId, now(), 3);
		}

		// Request replied message information
		const repliedId = (inboxMessage as TextMessage).replyTo;
		if (repliedId) {
			this.requestRepliedMessage(inboxMessage.roomId, inboxMessage.id, repliedId);
		}

		// Ask smart markers to update Check icon
		if (inboxMessage.type === MessageType.TEXT_MSG && inboxMessage.from === sessionId) {
			this.lastMarkers(inboxMessage.roomId);
		}
	}
	return true;
}

export function onGetInboxResponse(stanza: Element): true {
	console.log('Get inbox:', stanza);
	return true;
}

export function onSetInboxResponse(stanza: Element): true {
	// TODO how to use this data?
	const unread_messages = stanza.getElementsByTagName('unread-messages')[0]?.textContent;
	xmppDebug(`<--- End inbox request, unread: ${unread_messages}`);
	return true;
}
