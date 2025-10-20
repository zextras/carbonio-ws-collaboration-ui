/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import useStore from '../../../store/Store';
import {
	BackfillRequest,
	ConfigurationMessage,
	MessageFastening,
	MessageRange,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

function detectGaps(messageRanges: MessageRange[]): BackfillRequest[] {
	if (messageRanges.length < 2) return [];

	const gaps: BackfillRequest[] = [];

	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < messageRanges.length - 1; i++) {
		const older = messageRanges[i];
		const newer = messageRanges[i + 1];

		if (newer.oldestTimestamp > older.newestTimestamp) {
			gaps.push({
				afterDate: older.newestTimestamp,
				beforeDate: newer.oldestTimestamp
			});
		}
	}
	return gaps;
}

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
	store.updateHistory(roomId, storeMessages);

	// Request message subject of reply
	forEach(storeMessages, (message) => {
		const messageSubjectOfReplyId = (message as TextMessage).replyTo;
		if (messageSubjectOfReplyId) {
			xmppClient.requestMessageSubjectOfReply(message.roomId, messageSubjectOfReplyId, message.id);
		}
	});

	if (historyMessages.length > 0) {
		const oldest = historyMessages[0];
		const newest = historyMessages[historyMessages.length - 1];

		const rangeInfo: MessageRange = {
			oldestId: oldest.id,
			newestId: newest.id,
			oldestTimestamp: oldest.date,
			newestTimestamp: newest.date
		};

		store.addMessageRange(roomId, rangeInfo);
	}

	const gaps = detectGaps(useStore.getState().chatsRegistry[roomId].messageRanges ?? []);
	store.enqueueBackfill(roomId, gaps);

	if (useStore.getState().chatsRegistry[roomId].backfillQueue.length > 0) {
		const request = useStore.getState().chatsRegistry[roomId].backfillQueue[0];
		store.shiftBackfillQueue(roomId);
		xmppClient.requestHistoryBetweenTwoDates(roomId, request.afterDate, request.beforeDate);
	}
}
