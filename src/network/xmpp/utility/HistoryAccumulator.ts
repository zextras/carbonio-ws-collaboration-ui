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

	constructor() {
		this.histories = {};
		this.repliedMessages = {};
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

	public addRepliedMessage(message: Message): void {
		this.repliedMessages[message.id] = message;
	}

	public returnRepliedMessage(messageId: string): TextMessage {
		const message = this.repliedMessages[messageId];
		delete this.repliedMessages[messageId];
		return message as TextMessage;
	}
}

export default HistoryAccumulator.getInstance();
