/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, size } from 'lodash';

import useStore from '../../../store/Store';
import {
	ConfigurationMessage,
	MessageFastening,
	MessageRange,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';
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
export function requestHistoryWithBackfillCallback(stanza: Element, queryId: string): void {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
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

	// Store history messages on store updating the history of the room
	if (size(storeMessages) > 0) {
		store.updateHistory(roomId, storeMessages);

		const messagesWithStanzaId = storeMessages.filter(
			(msg): msg is TextMessage => msg.type === MessageType.TEXT_MSG
		);

		if (messagesWithStanzaId.length > 0) {
			const oldest = messagesWithStanzaId[0];
			const newest = messagesWithStanzaId[messagesWithStanzaId.length - 1];

			const rangeInfo: MessageRange = {
				oldestStanzaId: oldest.stanzaId,
				newestStanzaId: newest.stanzaId,
				oldestTimestamp: oldest.date,
				newestTimestamp: newest.date,
				count: messagesWithStanzaId.length
			};

			store.addMessageRange(roomId, rangeInfo);
			store.detectAndFillGaps(roomId);
			store.processBackfillQueue(roomId);
		}
	}

	// Request message subject of reply
	forEach(storeMessages, (message) => {
		const messageSubjectOfReplyId = (message as TextMessage).replyTo;
		if (messageSubjectOfReplyId) {
			xmppClient.requestMessageSubjectOfReply(message.roomId, messageSubjectOfReplyId, message.id);
		}
	});
}
