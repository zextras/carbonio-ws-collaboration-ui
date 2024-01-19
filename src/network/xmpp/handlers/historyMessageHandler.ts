/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, size, unionBy } from 'lodash';
import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { dateToTimestamp } from '../../../utils/dateUtils';
import { xmppDebug } from '../../../utils/debug';
import { getId } from '../utility/decodeJid';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import { decodeXMPPMessageStanza } from '../utility/decodeXMPPMessageStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

/**
 * MESSAGE ARCHIVE MANAGEMENT (XEP-0313)
 * Documentation: https://xmpp.org/extensions/xep-0313.html
 */

export enum MamRequestType {
	HISTORY = 'history',
	REPLIED = 'replied',
	FORWARDED = 'forwarded'
}

export function onHistoryMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const id = getRequiredAttribute(result, 'id');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const historyMessage = decodeXMPPMessageStanza(insideMessage, {
		date: dateToTimestamp(date),
		stanzaId: id
	});

	if (historyMessage) {
		// Check message request type
		const queryId = getAttribute(result, 'queryid');
		switch (queryId) {
			case MamRequestType.HISTORY: {
				if (historyMessage.type === MessageType.FASTENING) {
					useStore.getState().addFastening(historyMessage);
				} else {
					HistoryAccumulator.addMessageToHistory(historyMessage.roomId, historyMessage);
				}
				break;
			}
			case MamRequestType.REPLIED: {
				if (historyMessage.type === MessageType.TEXT_MSG) {
					HistoryAccumulator.addReferenceForRepliedMessage(historyMessage);
				} else {
					console.warn('Replied message type not supported', historyMessage);
				}
				break;
			}
			case MamRequestType.FORWARDED: {
				if (historyMessage.type === MessageType.TEXT_MSG) {
					HistoryAccumulator.addReferenceForForwardedMessage(
						historyMessage.stanzaId,
						insideMessage
					);
				}
				break;
			}
			default:
				xmppDebug('Unknown MAM request type');
		}
	}
	return true;
}

/**
 *
 * After we request the history, when the last message arrived(based on number of messages requested)
 * When there are no more messages to load the server return an IQ with <fin> set as completed="true"
 * With this information we now there are no more messages to load in the history
 * https://xmpp.org/extensions/xep-0313.html#:~:text=the%20server%20MUST%20include%20a%20%27complete%27%20attribute%20on%20the%20%3Cfin%3E%20element
 *
 * 1- This function retrieve the messages from the History accumulator
 * 2- Checks if history is complete loaded
 * 3- Set HistoryLoadDisabled to allow the request history again
 * 4- Updates the history of the conversations with the messages arrives
 * 5- Checks for replied messages and in case request the message in the history
 * 6- Updates the last message read of all the members of a room
 *
 * */
export function onRequestHistory(stanza: Element, unread?: number): void {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const fin = getRequiredTagElement(stanza, 'fin');
	const isHistoryFullyLoaded = fin.getAttribute('complete');
	const store = useStore.getState();
	const { xmppClient } = store.connections;

	const historyMessages = HistoryAccumulator.returnHistory(roomId);

	// History is fully loaded if the response is marked as complete
	// or if there are no messages in the response because the history has been cleared
	if (isHistoryFullyLoaded || size(historyMessages) === 0) store.setHistoryIsFullyLoaded(roomId);

	// If unread are more than loaded text messages, request history again
	// Do this check here to load history only when user opens conversation
	if (size(historyMessages) > 0 && unread && unread > 0) {
		const textMessages = filter(
			unionBy(historyMessages, store.messages[roomId], 'id'),
			(message) => message.type === MessageType.TEXT_MSG
		);
		const unreadNotLoaded = unread - size(textMessages);
		if (unreadNotLoaded > 0) {
			// Request 5 more messages to avoid a new history request when user scrolls to the first new message
			xmppClient.requestHistory(roomId, historyMessages[0].date, unreadNotLoaded + 5, unread);
		}
	}

	// Store history messages on store updating the history of the room
	if (historyMessages.length > 0) store.updateHistory(roomId, historyMessages);

	// Add message of creation room at the start of the history
	const historyIsBeenCleared = !!store.rooms[roomId].userSettings?.clearedAt;
	if (isHistoryFullyLoaded && !historyIsBeenCleared) store.addCreateRoomMessage(roomId);

	// Set history loadable again
	store.setHistoryLoadDisabled(roomId, false);

	// Request message subject of reply
	forEach(historyMessages, (message) => {
		const messageSubjectOfReplyId = (message as TextMessage).replyTo;
		if (messageSubjectOfReplyId) {
			xmppClient.requestMessageSubjectOfReply(message.roomId, messageSubjectOfReplyId, message.id);
		}
	});

	// Update last marker
	xmppClient.lastMarkers(roomId);
}

export function onRequestSingleMessage(stanza: Element, messageWithResponseId: string): void {
	const referenceMessageId = Strophe.getText(getRequiredTagElement(stanza, 'first'));
	const referenceMessage = HistoryAccumulator.returnReferenceForRepliedMessage(referenceMessageId);
	const store: RootStore = useStore.getState();
	store.setRepliedMessage(referenceMessage.roomId, messageWithResponseId, referenceMessage);
}
