/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, size, unionBy } from 'lodash';

import useStore from '../../../store/Store';
import { MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { xmppDebug } from '../../../utils/debug';
import { getId } from '../utility/decodeJid';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

/**
 * MESSAGE ARCHIVE MANAGEMENT (XEP-0313)
 * Documentation: https://xmpp.org/extensions/xep-0313.html
 */

export function onHistoryMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');

	const queryId = getAttribute(result, 'queryid');
	if (!queryId) {
		console.warn('MAM message without queryId, ignoring');
	} else {
		HistoryAccumulator.pushToCache(queryId, message);
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
export function onRequestHistory(stanza: Element, queryId: string, unread?: number): void {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const fin = getRequiredTagElement(stanza, 'fin');
	const isHistoryFullyLoaded = fin.getAttribute('complete');
	const store = useStore.getState();
	const { xmppClient } = store.connections;

	const historyMessages = HistoryAccumulator.getHistoryMessages(queryId);

	const fasteningMessages = filter(
		historyMessages,
		(message) => message.type === MessageType.FASTENING
	);

	fasteningMessages.forEach((message) => useStore.getState().addFastening(message));

	if (size(historyMessages) > 0) {
		store.setLastMamMessage(historyMessages[0]);
	}

	// Filter messages by type
	const storeMessages = filter(
		historyMessages,
		(message) =>
			message.type === MessageType.TEXT_MSG || message.type === MessageType.CONFIGURATION_MSG
	);

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
	if (size(storeMessages) > 0) {
		store.updateHistory(roomId, storeMessages);
	}

	// Add message of creation room at the start of the history
	const historyIsBeenCleared = !!store.rooms[roomId].userSettings?.clearedAt;
	if (isHistoryFullyLoaded && !historyIsBeenCleared) store.addCreateRoomMessage(roomId);

	// Set history loadable again
	store.setHistoryLoadDisabled(roomId, false);

	// Request message subject of reply
	forEach(storeMessages, (message) => {
		const messageSubjectOfReplyId = (message as TextMessage).replyTo;
		if (messageSubjectOfReplyId) {
			xmppClient.requestMessageSubjectOfReply(message.roomId, messageSubjectOfReplyId, message.id);
		}
	});

	// Update last marker
	xmppClient.lastMarkers(roomId);
}

export function onRequestSingleMessage(messageWithResponseId: string, queryId: string): void {
	const referenceMessage = HistoryAccumulator.getRepliedMessage(queryId);
	const store: RootStore = useStore.getState();
	store.setRepliedMessage(referenceMessage.roomId, messageWithResponseId, referenceMessage);
}

export function onLoadFullHistory(stanza: Element, queryId: string): void {
	const messages = HistoryAccumulator.getFullHistoryMessages(queryId);
	useStore.getState().session.chatExporting?.exporter?.addMessagesToFullHistory(messages);
	xmppDebug('Request full history', stanza);
	const roomId = getId(getRequiredAttribute(stanza, 'from'));
	const { chatExporting } = useStore.getState().session;

	if (chatExporting?.roomId === roomId) {
		const isHistoryComplete = getRequiredTagElement(stanza, 'fin').getAttribute('complete');
		if (isHistoryComplete) {
			chatExporting.exporter.exportHistory();
		} else {
			chatExporting.exporter.continueExporting();
		}
	}
}
