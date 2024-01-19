/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { includes } from 'lodash';
import { Strophe } from 'strophe.js';

import { getId, getResource } from './decodeJid';
import {
	getAttribute,
	getRequiredAttribute,
	getRequiredTagElement,
	getTagElement
} from './decodeStanza';
import {
	ConfigurationMessage,
	Message,
	MessageFastening,
	MessageType,
	OperationType,
	TextMessage
} from '../../../types/store/MessageTypes';
import { calcReads } from '../../../utils/calcReads';
import { dateToTimestamp, now } from '../../../utils/dateUtils';
import { unicodeToChar } from '../../../utils/textUtils';

type OptionalParameters = {
	date?: number;
	stanzaId?: string;
};
export function decodeXMPPMessageStanza(
	messageStanza: Element,
	optional?: OptionalParameters
): Message | undefined {
	const messageId = getRequiredAttribute(messageStanza, 'id');
	const fromAttribute = getRequiredAttribute(messageStanza, 'from');
	const roomId = getId(fromAttribute);
	const resource = getResource(fromAttribute);
	const messageDate = optional?.date || now();

	// Message fastening
	const fasteningElement = getTagElement(messageStanza, 'apply-to');
	if (fasteningElement) {
		const originalStanzaId = getRequiredAttribute(fasteningElement, 'id');

		// Message Fastening for a delete message
		const retracted = getTagElement(fasteningElement, 'retract');
		if (retracted) {
			const message: MessageFastening = {
				id: messageId,
				type: MessageType.FASTENING,
				action: 'delete',
				roomId,
				date: messageDate,
				originalStanzaId
			};
			return message;
		}

		// Message Fastening for an edited message
		const edited = getTagElement(fasteningElement, 'edit');
		if (edited) {
			const body = getTagElement(messageStanza, 'body');
			const message: MessageFastening = {
				id: messageId,
				type: MessageType.FASTENING,
				action: 'edit',
				roomId,
				date: messageDate,
				originalStanzaId,
				value: body?.textContent || ''
			};
			return message;
		}
	}

	// Affiliation message are not considered, they are replaced by configuration messages
	const x = getTagElement(messageStanza, 'x');
	if (x && x.getAttribute('xmlns') === Strophe.NS.AFFILIATIONS) {
		return undefined;
	}

	// Configuration message
	if (x && x.getAttribute('xmlns') === Strophe.NS.CONFIGURATION) {
		const operation = Strophe.getText(getRequiredTagElement(x, 'operation'));
		if (includes(OperationType, operation)) {
			let value = '';
			switch (operation) {
				case OperationType.ROOM_NAME_CHANGED:
				case OperationType.ROOM_DESCRIPTION_CHANGED:
					value = unicodeToChar(Strophe.getText(getRequiredTagElement(x, 'value')) || '');
					break;
				case OperationType.ROOM_PICTURE_UPDATED:
					value = unicodeToChar(Strophe.getText(getRequiredTagElement(x, 'picture-name')) || '');
					break;
				case OperationType.MEMBER_ADDED:
				case OperationType.MEMBER_REMOVED: {
					value = Strophe.getText(getRequiredTagElement(x, 'user-id'));
					break;
				}
				default:
					break;
			}

			const message: ConfigurationMessage = {
				id: messageId,
				roomId,
				date: messageDate,
				type: MessageType.CONFIGURATION_MSG,
				from: getId(resource),
				operation,
				value,
				read: calcReads(messageDate, roomId)
			};
			return message;
		}
	}

	// Retracted message
	const retracted = getTagElement(messageStanza, 'retracted');
	if (retracted) {
		const stanzaIdReference = getTagElement(messageStanza, 'stanza-id');
		const stanzaId =
			optional?.stanzaId ||
			(stanzaIdReference && getRequiredAttribute(stanzaIdReference, 'id')) ||
			messageId;
		return {
			id: messageId,
			stanzaId,
			roomId,
			date: messageDate,
			type: MessageType.TEXT_MSG,
			from: getId(resource),
			text: '',
			read: calcReads(messageDate, roomId),
			deleted: true
		};
	}

	// Text message
	const body = messageStanza.getElementsByTagName('body')[0];
	if (body && resource) {
		const stanzaIdReference = getTagElement(messageStanza, 'stanza-id');
		const stanzaId =
			optional?.stanzaId ||
			(stanzaIdReference && getRequiredAttribute(stanzaIdReference, 'id')) ||
			messageId;
		const from = getId(resource);
		let messageTxt = body.textContent || '';

		// Message is a reply to another message
		let replyTo;
		const replyElement = getTagElement(messageStanza, 'reply');
		if (replyElement != null) {
			replyTo = getRequiredAttribute(replyElement, 'id');
		}

		// Message is a forwarded message from another conversation
		let forwarded;
		const forwardedElement = messageStanza.getElementsByTagName('forwarded')[0];
		if (forwardedElement) {
			const forwardCount = getAttribute(forwardedElement, 'count') || '1';
			const delayElement = getRequiredTagElement(forwardedElement, 'delay');
			const forwardedMessageElement = getRequiredTagElement(forwardedElement, 'message');
			messageTxt = unicodeToChar(
				getRequiredTagElement(forwardedMessageElement, 'body').textContent || ''
			);

			forwarded = {
				id: getRequiredAttribute(forwardedMessageElement, 'id'),
				date: dateToTimestamp(getRequiredAttribute(delayElement, 'stamp')),
				from: getId(getResource(getRequiredAttribute(forwardedMessageElement, 'from'))),
				count: parseInt(forwardCount, 10)
			};
		}

		// Message has an attachment
		let attachment;
		if (x && x.getAttribute('xmlns') === Strophe.NS.CONFIGURATION) {
			const operation = Strophe.getText(getRequiredTagElement(x, 'operation'));
			if (operation === 'attachmentAdded') {
				const attachmentId = Strophe.getText(getRequiredTagElement(x, 'attachment-id'));
				const filename = Strophe.getText(getRequiredTagElement(x, 'filename'));
				const fileMimeType = Strophe.getText(getRequiredTagElement(x, 'mime-type'));
				const fileSize = Strophe.getText(getRequiredTagElement(x, 'size'));

				const area = getTagElement(x, 'area') ? Strophe.getText(getTagElement(x, 'area')) : '0x0';

				attachment = {
					id: attachmentId,
					name: unicodeToChar(filename || ''),
					mimeType: fileMimeType || '',
					size: fileSize || 0,
					area
				};

				// Text ad description of the attachment has to be decoded
				messageTxt = unicodeToChar(messageTxt);
			}
		}

		const message: TextMessage = {
			id: messageId,
			stanzaId,
			roomId,
			date: messageDate,
			type: MessageType.TEXT_MSG,
			from,
			text: messageTxt,
			read: calcReads(messageDate, roomId),
			replyTo,
			edited: false,
			forwarded,
			attachment
		};

		// Special case: if the forwarded message is from the same person that forward the message,
		// the message is seen as a normal message and not a forwarded one
		if (message.from === message.forwarded?.from) {
			message.forwarded = undefined;
		}

		return message;
	}
	return undefined;
}
