/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';
import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { MessageType, TextMessage } from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { dateToTimestamp } from '../../../utils/dateUtil';
import { xmppDebug } from '../../../utils/debug';
import { getId } from '../utility/decodeJid';
import { decodeMessage } from '../utility/decodeMessage';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';
import XMPPClient from '../XMPPClient';

/**
 * MESSAGE ARCHIVE MANAGEMENT (XEP-0313)
 * Documentation: https://xmpp.org/extensions/xep-0313.html
 */

export enum MamRequestType {
	HISTORY = 'history',
	REPLIED = 'replied'
}

export function onHistoryMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const id = getRequiredAttribute(result, 'id');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const historyMessage = decodeMessage(insideMessage, {
		date: dateToTimestamp(date),
		stanzaId: id
	});

	if (historyMessage) {
		// Check message request type
		const queryId = getAttribute(result, 'queryid');
		switch (queryId) {
			case MamRequestType.HISTORY: {
				if (historyMessage.type === MessageType.DELETED_MSG) {
					HistoryAccumulator.replaceDeletedMessageInTheHistory(
						historyMessage.roomId,
						historyMessage
					);
				} else if (historyMessage.type === MessageType.TEXT_MSG && historyMessage.edited) {
					HistoryAccumulator.replaceMessageEditedInTheHistory(
						historyMessage.roomId,
						historyMessage
					);
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
			default:
				console.log('Unknown MAM request type ');
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
export function onRequestHistory(this: XMPPClient, stanza: Element): void {
	xmppDebug(`<--- End request history`);
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const store = useStore.getState();

	const historyMessages = HistoryAccumulator.returnHistory(roomId);

	// Set load history
	const fin = getRequiredTagElement(stanza, 'fin');
	const isHistoryFullyLoaded = fin.getAttribute('complete');
	if (isHistoryFullyLoaded || historyMessages.length === 0) store.setHistoryIsFullyLoaded(roomId);

	// Store history messages on store updating the history of the room
	if (historyMessages.length > 0) store.updateHistory(roomId, historyMessages);

	// Set history loadable again
	store.setHistoryLoadDisabled(roomId, false);

	// Request reference message info inside a replied message
	forEach(historyMessages, (message) => {
		const referenceId = (message as TextMessage).replyTo;
		if (referenceId) {
			this.requestMessageInsideAReply(message.roomId, referenceId, message.id);
		}
	});

	// Update last marker
	this.lastMarkers(roomId);
}

export function onRequestSingleMessage(messageWithResponseId: string, stanza: Element): void {
	const referenceMessageId = Strophe.getText(getRequiredTagElement(stanza, 'first'));
	const referenceMessage = HistoryAccumulator.returnReferenceForRepliedMessage(referenceMessageId);
	const store: RootStore = useStore.getState();
	store.setRepliedMessage(referenceMessage.roomId, messageWithResponseId, referenceMessage);
}
