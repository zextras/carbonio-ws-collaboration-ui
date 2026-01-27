/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { orderBy } from 'lodash';

import { getRequiredAttribute, getRequiredTagElement } from './decodeStanza';
import { decodeXMPPMessageStanza } from './decodeXMPPMessageStanza';
import {
	MarkerStatus,
	Message,
	MessageType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../../utils/dateUtils';

class HistoryAccumulator {
	// Singleton design pattern
	private static instance: HistoryAccumulator;

	public static getInstance(): HistoryAccumulator {
		if (!HistoryAccumulator.instance) {
			HistoryAccumulator.instance = new HistoryAccumulator();
		}
		return HistoryAccumulator.instance;
	}

	private cachedElements: { [queryId: string]: Element[] };

	private currentId: number = 0;

	constructor() {
		this.cachedElements = {};
	}

	public getNextId(): string {
		this.currentId += 1;
		return this.currentId.toString();
	}

	public pushToCache(queryId: string, element: Element): void {
		if (!this.cachedElements[queryId]) this.cachedElements[queryId] = [];
		this.cachedElements[queryId].push(element);
	}

	public getCachedElements(queryId: string): Element[] {
		const elements = this.cachedElements[queryId] || [];
		delete this.cachedElements[queryId];
		return elements;
	}

	public getForwardedMessage(queryId: string): Element {
		const cachedElements = this.getCachedElements(queryId);
		if (cachedElements.length !== 1) {
			throw new Error('There should be exactly one cached element for forwarded messages');
		}
		const message = cachedElements[0];

		const result = getRequiredTagElement(message, 'result');
		const id = getRequiredAttribute(result, 'id');
		const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
		const insideMessage = getRequiredTagElement(result, 'message');
		const historyMessage = decodeXMPPMessageStanza(insideMessage, {
			date: dateToTimestamp(date),
			stanzaId: id
		});
		if (!historyMessage || historyMessage.type !== MessageType.TEXT_MSG) {
			throw new Error('Error decoding forwarded message');
		}
		return insideMessage;
	}

	public getSearchedMessages(queryId: string): TextMessage[] {
		const cachedElements = this.getCachedElements(queryId);

		const messages = cachedElements.reduce<TextMessage[]>((accumulator, message) => {
			const result = getRequiredTagElement(message, 'result');
			const id = getRequiredAttribute(result, 'id');
			const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
			const insideMessage = getRequiredTagElement(result, 'message');
			const historyMessage = decodeXMPPMessageStanza(insideMessage, {
				date: dateToTimestamp(date),
				stanzaId: id
			});

			if (historyMessage && historyMessage.type === MessageType.TEXT_MSG) {
				accumulator.push(historyMessage);
			}

			return accumulator;
		}, []);

		return orderBy(messages, ['date'], ['desc']);
	}

	public getRepliedMessage(queryId: string): TextMessage {
		const cachedElements = this.getCachedElements(queryId);
		if (cachedElements.length !== 1) {
			throw new Error('There should be exactly one cached element for replied messages');
		}
		const message = cachedElements[0];

		const result = getRequiredTagElement(message, 'result');
		const id = getRequiredAttribute(result, 'id');
		const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
		const insideMessage = getRequiredTagElement(result, 'message');
		const historyMessage = decodeXMPPMessageStanza(insideMessage, {
			date: dateToTimestamp(date),
			stanzaId: id
		});
		if (!historyMessage || historyMessage.type !== MessageType.TEXT_MSG) {
			throw new Error('Error decoding forwarded message');
		}
		return historyMessage;
	}

	public getHistoryMessages(queryId: string): Message[] {
		const cachedElements = this.getCachedElements(queryId);

		const messages = cachedElements.reduce<Message[]>((accumulator, message) => {
			const result = getRequiredTagElement(message, 'result');
			const id = getRequiredAttribute(result, 'id');
			const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
			const insideMessage = getRequiredTagElement(result, 'message');
			const historyMessage = decodeXMPPMessageStanza(insideMessage, {
				date: dateToTimestamp(date),
				stanzaId: id
			});

			if (historyMessage) {
				accumulator.push(historyMessage);
			}

			return accumulator;
		}, []);

		return orderBy(messages, ['date'], ['asc']);
	}

	public getFullHistoryMessages(queryId: string): Message[] {
		const cachedElements = this.getCachedElements(queryId);

		return cachedElements.reduce<Message[]>((accumulator, message) => {
			const result = getRequiredTagElement(message, 'result');
			const id = getRequiredAttribute(result, 'id');
			const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
			const insideMessage = getRequiredTagElement(result, 'message');
			const historyMessage = decodeXMPPMessageStanza(insideMessage, {
				date: dateToTimestamp(date),
				stanzaId: id
			});

			if (historyMessage) {
				accumulator.push(historyMessage);
			}

			return accumulator;
		}, []);
	}

	public getPinnedMessage(queryId: string): TextMessage {
		const cachedElements = this.getCachedElements(queryId);
		if (cachedElements.length !== 1) {
			throw new Error('There should be exactly one cached element for pinned messages');
		}
		const message = cachedElements[0];
		const result = getRequiredTagElement(message, 'result');
		const id = getRequiredAttribute(result, 'id');
		const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
		const insideMessage = getRequiredTagElement(result, 'message');
		const historyMessage = decodeXMPPMessageStanza(insideMessage, {
			date: dateToTimestamp(date),
			stanzaId: id
		});

		if (!historyMessage) {
			throw new Error('Error decoding pinned message');
		}

		// spostare la logica su requestpinned
		if (historyMessage.type === MessageType.FASTENING && historyMessage.action === 'edit') {
			return {
				...historyMessage,
				type: MessageType.TEXT_MSG,
				stanzaId: historyMessage.originalStanzaId,
				text: historyMessage.value || '',
				read: MarkerStatus.READ,
				edited: true,
				editedStanzaId: historyMessage.stanzaId
			} as TextMessage;
		}

		if (!historyMessage || historyMessage.type !== MessageType.TEXT_MSG) {
			throw new Error('Error decoding pinned message');
		}
		return historyMessage;
	}
}

export default HistoryAccumulator.getInstance();
