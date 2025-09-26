/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { orderBy } from 'lodash';

import { Message, TextMessage } from '../../../types/store/ChatsRegistryTypes';

class HistoryAccumulator {
	// Singleton design pattern
	private static instance: HistoryAccumulator;

	public static getInstance(): HistoryAccumulator {
		if (!HistoryAccumulator.instance) {
			HistoryAccumulator.instance = new HistoryAccumulator();
		}
		return HistoryAccumulator.instance;
	}

	private histories: { [id: string]: Message[] };

	private repliedMessages: { [id: string]: Message };

	private forwardedMessages: { [id: string]: Element };

	private searchedMessages: { [id: string]: TextMessage[] };

	constructor() {
		this.histories = {};
		this.repliedMessages = {};
		this.forwardedMessages = {};
		this.searchedMessages = {};
	}

	public addMessageToHistory(roomId: string, message: Message): void {
		if (!this.histories[roomId]) this.histories[roomId] = [];
		this.histories[roomId].push(message);
	}

	public returnHistory(roomId: string): Message[] {
		const history = this.histories[roomId] || [];
		delete this.histories[roomId];
		return orderBy(history, ['date'], ['asc']);
	}

	public addReferenceForRepliedMessage(message: TextMessage): void {
		this.repliedMessages[message.stanzaId] = message;
	}

	public returnReferenceForRepliedMessage(messageId: string): TextMessage {
		const message = this.repliedMessages[messageId];
		delete this.repliedMessages[messageId];
		return message as TextMessage;
	}

	public addReferenceForForwardedMessage(stanzaId: string, message: Element): void {
		this.forwardedMessages[stanzaId] = message;
	}

	public returnReferenceForForwardedMessage(messageStanzaId: string): Element {
		const message = this.forwardedMessages[messageStanzaId];
		delete this.forwardedMessages[messageStanzaId];
		return message;
	}

	public addMessageToSearchedMessages(roomId: string, message: TextMessage): void {
		if (!this.searchedMessages[roomId]) this.searchedMessages[roomId] = [];
		this.searchedMessages[roomId].push(message);
	}

	public returnSearchedMessages(roomId: string): TextMessage[] {
		const searchedMessages = this.searchedMessages[roomId] || [];
		delete this.searchedMessages[roomId];
		return orderBy(searchedMessages, ['date'], ['desc']);
	}
}

export default HistoryAccumulator.getInstance();
