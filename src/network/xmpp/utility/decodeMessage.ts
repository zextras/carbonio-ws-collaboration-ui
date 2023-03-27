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
	ConfigurationMessage, DeletedMessage,
	Message, MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';
import { dateToTimestamp, isBefore, now } from '../../../utils/dateUtil';
import { getId, getResource } from './decodeJid';
import useStore from '../../../store/Store';
import { find, forEach, size } from 'lodash';
import { Marker, MarkerStatus, RoomMarkers } from '../../../types/store/MarkersTypes';
import { Member } from '../../../types/store/RoomTypes';
import { getRequiredAttribute, getRequiredTagElement, getTagElement } from './decodeStanza';

type OptionalParameters = {
	date?: number;
	stanzaId?: string;
};

export function decodeMessage(messageStanza: Element, optional?: OptionalParameters): Message | undefined {
	const messageId = getRequiredAttribute(messageStanza, 'id');
	const fromAttribute = getRequiredAttribute(messageStanza, 'from');
	const roomId = getId(fromAttribute);
	const resource = getResource(fromAttribute);
	const messageDate = optional?.date || now();
	let message: Message;

	// Retract/deleted message
	const retracted = getTagElement(messageStanza, 'retract');
	if (retracted) {
		const from = getId(resource);
		const deletedMessageId = messageStanza.getElementsByTagName('apply-to')[0].id;

		const message = {
			id: deletedMessageId,
			roomId,
			type: MessageType.DELETED_MSG,
			date: messageDate,
			from
		};
		return message as DeletedMessage;
	}

	// Affiliation message
	const x = getTagElement(messageStanza, 'x');
	if (x && x.getAttribute('xmlns') === Strophe.NS.AFFILIATIONS) {
		const user = getId(Strophe.getText(x.getElementsByTagName('user')[0]));
		const userElement = getRequiredTagElement(x, 'user');
		const affiliationAttribute = getRequiredAttribute(userElement, 'affiliation');
		message = {
			id: messageId,
			roomId,
			date: messageDate,
			type: MessageType.AFFILIATION_MSG,
			userId: user,
			as: affiliationAttribute
		};
		return message as AffiliationMessage;
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
				message = {
					id: messageId,
					roomId,
					date: messageDate,
					type: MessageType.CONFIGURATION_MSG,
					from: getId(resource),
					operation,
					value
				};
				return message as ConfigurationMessage;
			}
		}
	}

	// Text message
	const body = messageStanza.getElementsByTagName('body')[0];
	if (body && resource) {
		const stanzaIdReference = getTagElement(messageStanza, 'stanza-id');
		const stanzaId = optional?.stanzaId || (stanzaIdReference && getRequiredAttribute(stanzaIdReference, 'id') || messageId);
		const from = getId(resource);
		const messageTxt = decode(body.textContent || '');

		// Message is a reply to another message
		let replyTo;
		const replyElement = getTagElement(messageStanza, 'reply');
		if (replyElement != null) {
			replyTo = getRequiredAttribute(replyElement, 'id');
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
					name: decode(filename) || "",
					mimeType: fileMimeType || "",
					size: fileSize || 0
				}
			}
		}


		// Message is a forwarded message from another conversation
		let forwarded;
		const forwardedElement = messageStanza.getElementsByTagName('forwarded')[0];
		if (forwardedElement) {
			const forwardedMessageElement = getRequiredTagElement(forwardedElement, 'message');
			const delayElement = getRequiredTagElement(forwardedElement, 'delay');
			// Attachment forwarded decoding
			let forwardedAttachment;
			const x = getTagElement(messageStanza, 'x');
			if (x && x.getAttribute('xmlns') === Strophe.NS.CONFIGURATION) {
				const operation = Strophe.getText(getRequiredTagElement(x, 'operation'));
				if (operation === 'attachmentAdded') {
					const attachmentId = Strophe.getText(getRequiredTagElement(x, 'attachment-id'));
					const filename = getRequiredTagElement(x, 'filename').textContent;
					const fileMimeType = Strophe.getText(getRequiredTagElement(x, 'mime-type'));
					const fileSize = Strophe.getText(getRequiredTagElement(x, 'size'));
					forwardedAttachment =  {
						id: attachmentId,
						name: decode(filename) || "",
						mimeType: fileMimeType || "",
						size: fileSize || 0
					}
				}
			}
			forwarded = {
				id: getRequiredAttribute(forwardedMessageElement, 'id'),
				date: dateToTimestamp(getRequiredAttribute(delayElement, 'stamp')),
				from: getId(getResource(getRequiredAttribute(forwardedMessageElement, 'from'))),
				text: decode(getRequiredTagElement(forwardedMessageElement, 'body').textContent),
				attachment: forwardedAttachment
			}
		}

		// Correction/edited message
		const replaceTag = messageStanza.getElementsByTagName('replace')[0];
		if (replaceTag) {
			const from = getId(resource);
			const editedMessageId = replaceTag.id;
			const message = {
				id: editedMessageId,
				stanzaId,
				roomId,
				date: messageDate,
				type: MessageType.TEXT_MSG,
				from,
				text: messageTxt,
				replyTo,
				edited: true
			}
			return message as TextMessage;
		}

		message = {
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

		// Special case: if a message has a forwarded attachment, we have to remove the attachment from the message
		if (message.forwarded?.attachment) {
			message.attachment = undefined;
		}

		// Special case: if the forwarded message is from the same person that forward the message,
		// the message is seen as a normal message and not a forwarded one
		if (message.from === message.forwarded?.from) {
			message.text = message.forwarded.text;
			message.attachment = message.forwarded.attachment;
			message.forwarded = undefined;
		}

		return message as TextMessage;
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