/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findIndex } from 'lodash';

import useStore from '../../../store/Store';
import {
	Message,
	MessageList,
	MessageMap,
	MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';

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

	public addReferenceForRepliedMessage(message: TextMessage): void {
		this.repliedMessages[message.stanzaId] = message;
	}

	public returnReferenceForRepliedMessage(messageId: string): TextMessage {
		const message = this.repliedMessages[messageId];
		delete this.repliedMessages[messageId];
		return message as TextMessage;
	}

	public replaceDeletedMessageInTheHistory(roomId: string, message: Message): void {
		if (!this.histories[roomId]) this.histories[roomId] = [];
		const index = findIndex(this.histories[roomId], { id: message.id });
		if (
			this.histories[roomId][index] &&
			this.histories[roomId][index].id === message.id &&
			this.histories[roomId][index].type !== message.type
		) {
			this.histories[roomId].splice(index, 1, {
				...message,
				date: this.histories[roomId][index].date
			});
		} else if (!this.histories[roomId][index] && message.type === MessageType.DELETED_MSG) {
			// when arrives the deletion, but I still don't have the history I save it for the future history update
			const store = useStore.getState();
			store.addDeletedMessageRef(roomId, message);
		}
	}

	replaceMessageEditedInTheHistory(roomId: string, editedMessage: TextMessage): void {
		if (!this.histories[roomId]) this.histories[roomId] = [];
		const index = findIndex(this.histories[roomId], { id: editedMessage.id });
		if (
			this.histories[roomId][index] &&
			this.histories[roomId][index].id === editedMessage.id &&
			this.histories[roomId][index].type === MessageType.TEXT_MSG &&
			(this.histories[roomId][index] as TextMessage).edited !== editedMessage.edited
		) {
			const messageToReplace = this.histories[roomId][index];
			if (messageToReplace.type === MessageType.TEXT_MSG && messageToReplace.replyTo) {
				this.histories[roomId].splice(index, 1, {
					...editedMessage,
					date: messageToReplace.date,
					replyTo: messageToReplace.replyTo,
					repliedMessage: messageToReplace.repliedMessage
				});
			} else {
				this.histories[roomId].splice(index, 1, { ...editedMessage, date: messageToReplace.date });
			}
		} else if (!this.histories[roomId][index] && editedMessage.edited) {
			// when arrives the correction, but I still don't have the history I save it for the future history update
			const store = useStore.getState();
			store.addEditedMessageRef(roomId, editedMessage);
		}
	}
}

export default HistoryAccumulator.getInstance();
