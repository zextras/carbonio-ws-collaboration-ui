/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Message, MessageList, MessageMap, TextMessage } from '../../../types/store/MessageTypes';

class HistoryAccumulator {
	// Singleton design pattern
	private static instance: HistoryAccumulator;

	public static getInstance(): HistoryAccumulator {
		if (!HistoryAccumulator.instance) {
			HistoryAccumulator.instance = new HistoryAccumulator();
		}
		return HistoryAccumulator.instance;
	}

	private histories: MessageMap;

	private repliedMessages: { [id: string]: Message };

	private forwardedMessages: { [id: string]: Element };

	constructor() {
		this.histories = {};
		this.repliedMessages = {};
		this.forwardedMessages = {};
	}

	public addMessageToHistory(roomId: string, message: Message): void {
		if (!this.histories[roomId]) this.histories[roomId] = [];
		this.histories[roomId].push(message);
	}

	public returnHistory(roomId: string): MessageList {
		const history = this.histories[roomId] || [];
		delete this.histories[roomId];
		return history;
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
}

export default HistoryAccumulator.getInstance();
