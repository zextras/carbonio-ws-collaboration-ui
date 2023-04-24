/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import IXMPPClient from '../../../types/network/xmpp/IXMPPClient';
import { MessageType } from '../../../types/store/MessageTypes';
import { dateToTimestamp, now } from '../../../utils/dateUtil';
import { xmppDebug } from '../../../utils/debug';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';

/**
 * INBOX (XEP-0430)
 * Documentation: https://xmpp.org/extensions/xep-0430.html
 */

export function onInboxMessageStanza(this: IXMPPClient, message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const inboxMessage = decodeXMPPMessageStanza(insideMessage, { date: dateToTimestamp(date) });
	const sessionId = useStore.getState().session.id;

	if (inboxMessage) {
		const unreadMessagesOfSingleConversation = getRequiredAttribute(result, 'unread');
		const store = useStore.getState();
		store.addUnreadCount(inboxMessage.roomId, parseInt(unreadMessagesOfSingleConversation, 10));

		if (inboxMessage.type === MessageType.FASTENING) {
			// TODO - handle fastening

			// Last inboxMessage is a fastening, we need to request more messages to display the real last one
			this.requestHistory(inboxMessage.roomId, now(), 3);
		} else {
			store.newInboxMessage(inboxMessage);
		}

		if (inboxMessage.type === MessageType.TEXT_MSG) {
			// Request message subject of reply
			const messageSubjectOfReplyId = inboxMessage.replyTo;
			if (messageSubjectOfReplyId) {
				this.requestMessageSubjectOfReply(
					inboxMessage.roomId,
					messageSubjectOfReplyId,
					inboxMessage.id
				);
			}

			// Ask smart markers to update Check icon
			if (inboxMessage.from === sessionId) {
				this.lastMarkers(inboxMessage.roomId);
			}
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
