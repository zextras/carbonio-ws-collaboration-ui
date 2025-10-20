/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, size, unionBy } from 'lodash';

import useStore from '../../../store/Store';
import {
	ConfigurationMessage,
	MessageFastening,
	MessageRange,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

/**
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
 * */
export function requestHistoryCallback(stanza: Element, queryId: string, unread?: number): void {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const fin = getRequiredTagElement(stanza, 'fin');
	const isHistoryFullyLoaded = fin.getAttribute('complete');
	const store = useStore.getState();
	const { xmppClient } = store.connections;

	const historyMessages = HistoryAccumulator.getHistoryMessages(queryId);
	const storeMessages: (TextMessage | ConfigurationMessage)[] = [];
	const fasteningMessages: MessageFastening[] = [];
	historyMessages.forEach((message) => {
		if (message.type === MessageType.FASTENING) {
			fasteningMessages.push(message);
		} else {
			storeMessages.push(message);
		}
	});
	useStore.getState().addFastening(fasteningMessages);

	// If there are only fastening messages in the history, request more messages
	if (size(storeMessages) === 0 && size(fasteningMessages) > 0) {
		xmppClient.requestHistory(roomId, fasteningMessages[0].date, 50);
	}

	// History is fully loaded if the response is marked as complete
	// or if there are no messages in the response because the history has been cleared
	if (isHistoryFullyLoaded || size(historyMessages) === 0) {
		store.setHistoryIsFullyLoaded(roomId);
	}

	// If unread are more than loaded text messages, request history again
	// Do this check here to load history only when user opens conversation
	if (size(storeMessages) > 0 && unread && unread > 0) {
		const textMessages = filter(unionBy(storeMessages, store.chatsRegistry[roomId].messages, 'id'));
		const unreadNotLoaded = unread - size(textMessages);
		if (unreadNotLoaded > 0) {
			// Request 5 more messages to avoid a new history request when user scrolls to the first new message
			xmppClient.requestHistory(roomId, historyMessages[0].date, unreadNotLoaded + 5, unread);
		}
	}

	// Store history messages on store updating the history of the room
	store.updateHistory(roomId, storeMessages);

	// Request message subject of reply
	forEach(storeMessages, (message) => {
		const messageSubjectOfReplyId = (message as TextMessage).replyTo;
		if (messageSubjectOfReplyId) {
			xmppClient.requestMessageSubjectOfReply(message.roomId, messageSubjectOfReplyId, message.id);
		}
	});

	const oldest = historyMessages[0];
	const newest = historyMessages[historyMessages.length - 1];

	const rangeInfo: MessageRange = {
		oldestId: oldest.id,
		newestId: newest.id,
		oldestTimestamp: oldest.date,
		newestTimestamp: newest.date
	};

	store.addMessageRange(roomId, rangeInfo);

	// Add message of creation room at the start of the history
	const historyIsBeenCleared = !!store.rooms[roomId].userSettings?.clearedAt;
	if (isHistoryFullyLoaded && !historyIsBeenCleared) {
		store.addCreateRoomMessage(roomId);
	}

	// Set history loadable again
	store.setHistoryLoadDisabled(roomId, false);

	// Update last marker
	xmppClient.lastMarkers(roomId);
}
