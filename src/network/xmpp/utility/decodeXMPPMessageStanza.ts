/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable */

import { Strophe } from 'strophe.js';
import { decode } from 'html-entities';

import {
	AffiliationMessage,
	ConfigurationMessage,
	Message,
	MessageFastening,
	MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';
import { dateToTimestamp, isBefore, now } from '../../../utils/dateUtil';
import { getId, getResource } from './decodeJid';
import useStore from '../../../store/Store';
import { find, forEach, size } from 'lodash';
import { Marker, MarkerStatus, RoomMarkers } from '../../../types/store/MarkersTypes';
import { Member } from '../../../types/store/RoomTypes';
import {getAttribute, getRequiredAttribute, getRequiredTagElement, getTagElement} from './decodeStanza';

type OptionalParameters = {
	date?: number;
	stanzaId?: string;
};

export function decodeXMPPMessageStanza(messageStanza: Element, optional?: OptionalParameters): Message | undefined {
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
				originalStanzaId,
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
				value:body?.textContent || ''
			};
			return message;
		}
	}

	// Affiliation message
	const x = getTagElement(messageStanza, 'x');
	if (x && x.getAttribute('xmlns') === Strophe.NS.AFFILIATIONS) {
		const user = getId(Strophe.getText(x.getElementsByTagName('user')[0]));
		const userElement = getRequiredTagElement(x, 'user');
		const affiliationAttribute = getRequiredAttribute(userElement, 'affiliation');
		const message: AffiliationMessage = {
			id: messageId,
			roomId,
			date: messageDate,
			type: MessageType.AFFILIATION_MSG,
			userId: user,
			as: affiliationAttribute
		};
		return message;
	}

	// Configuration message
	if (x && x.getAttribute('xmlns') === Strophe.NS.CONFIGURATION) {
		const operation = Strophe.getText(getRequiredTagElement(x, 'operation'));
		switch (operation) {
			case 'roomNameChanged':
			case 'roomDescriptionChanged':
			case 'roomPictureUpdated':
			case 'roomPictureDeleted': {
				const value =
					operation === 'roomPictureUpdated'
						? Strophe.getText(getRequiredTagElement(x, 'picture-name'))
						: operation === 'roomPictureDeleted'
							? ''
							: decode(Strophe.getText(getRequiredTagElement(x, 'value')));
				const message: ConfigurationMessage = {
					id: messageId,
					roomId,
					date: messageDate,
					type: MessageType.CONFIGURATION_MSG,
					from: getId(resource),
					operation,
					value
				};
				return message;
			}
		}
	}

	// Text message
	const body = messageStanza.getElementsByTagName('body')[0];
	if (body && resource) {
		const stanzaIdReference = getTagElement(messageStanza, 'stanza-id');
		const stanzaId = optional?.stanzaId || (stanzaIdReference && getRequiredAttribute(stanzaIdReference, 'id') || messageId);
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
			console.log(messageStanza)
			const forwardCount = getAttribute(forwardedElement, 'count') || '1';
			const delayElement = getRequiredTagElement(forwardedElement, 'delay');
			const forwardedMessageElement = getRequiredTagElement(forwardedElement, 'message');
			messageTxt = decode(getRequiredTagElement(forwardedMessageElement, 'body').textContent || '');

			forwarded = {
				id: getRequiredAttribute(forwardedMessageElement, 'id'),
				date: dateToTimestamp(getRequiredAttribute(delayElement, 'stamp')),
				from: getId(getResource(getRequiredAttribute(forwardedMessageElement, 'from'))),
				count: parseInt(forwardCount)
			}
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
				attachment = {
					id: attachmentId,
					name: decodeURIComponent(filename || ""),
					mimeType: fileMimeType || "",
					size: fileSize || 0
				}

				// Text ad description of the attachment has to be decoded
				messageTxt = decodeURIComponent(messageTxt);
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
			forwarded: forwarded,
			attachment
		};

		// Special case: if the forwarded message is from the same person that forward the message,
		// the message is seen as a normal message and not a forwarded one
		if (message.from === message.forwarded?.from) {
			message.forwarded = undefined;
		}

		return message;
	}
}

export function calcReads(messageDate: number, roomId: string): MarkerStatus {
	const roomMessages: Message[] = useStore.getState().messages[roomId];
	const roomMarkers: RoomMarkers = useStore.getState().markers[roomId];
	const members: Member[] | undefined = useStore.getState().rooms[roomId]
		? useStore.getState().rooms[roomId].members
		: [];

	const readBy: string[] = [];
	let read: MarkerStatus = MarkerStatus.UNREAD;

	if (roomMarkers != null && members != null && size(members) > 0) {
		forEach(roomMarkers, (marker: Marker, userId: string) => {
			const markedMessage = find(
				roomMessages,
				(message: Message) => message.id === marker.messageId
			) as TextMessage;
			if (markedMessage && isBefore(messageDate, markedMessage.date)) {
				readBy.push(userId);
			}
		});

		if (size(readBy) > 1) {
			if (size(readBy) >= size(members)) {
				read = MarkerStatus.READ;
			} else {
				read = MarkerStatus.READ_BY_SOMEONE;
			}
		}
	}
	return read;
}