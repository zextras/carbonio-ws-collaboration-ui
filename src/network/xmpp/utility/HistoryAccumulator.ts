/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { orderBy } from 'lodash';

import { getRequiredAttribute, getRequiredTagElement } from './decodeStanza';
import { decodeXMPPMessageStanza } from './decodeXMPPMessageStanza';
import { Message, MessageType, TextMessage } from '../../../types/store/ChatsRegistryTypes';
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

	private cachedElements: { [queryId: string]: (Element | Message)[] };

	private currentId: number = 0;

	constructor() {
		this.cachedElements = {};
	}

	public getNextId(): string {
		this.currentId += 1;
		return this.currentId.toString();
	}

	public pushToCache(queryId: string, element: Element | Message): void {
		if (!this.cachedElements[queryId]) this.cachedElements[queryId] = [];
		this.cachedElements[queryId].push(element);
	}

	public getCachedElements(queryId: string): (Element | Message)[] {
		const elements = this.cachedElements[queryId] || [];
		delete this.cachedElements[queryId];
		return elements;
	}

	public getForwardedMessage(queryId: string): Element {
		const cachedElements = this.getCachedElements(queryId) as Element[];
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
		const cachedElements = this.getCachedElements(queryId) as Element[];

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
		const cachedElements = this.getCachedElements(queryId) as Element[];
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
		const cachedElements = this.getCachedElements(queryId) as Element[];

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
		const cachedElements = this.getCachedElements(queryId) as Element[];

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

	public getPinnedMessage(queryId: string): Message {
		const cachedElements = this.getCachedElements(queryId) as Element[];
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

		if (
			!historyMessage ||
			(historyMessage.type !== MessageType.TEXT_MSG &&
				historyMessage.type !== MessageType.FASTENING)
		) {
			throw new Error('Error decoding pinned message');
		}
		return historyMessage;
	}

	getInboxMessages(queryId: string): Message[] {
		return this.getCachedElements(queryId) as Message[];
	}
}

export default HistoryAccumulator.getInstance();
