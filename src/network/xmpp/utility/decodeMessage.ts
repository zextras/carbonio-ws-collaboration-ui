/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable */

import { Strophe } from 'strophe.js';

import {
	AffiliationMessage,
	ConfigurationMessage,
	DeletedMessage,
	Message, MessageType,
	TextMessage
} from '../../../types/store/MessageTypes';
import {dateToTimestamp, isBefore, now} from '../../../utils/dateUtil';
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

	// Text message
	const body = messageStanza.getElementsByTagName('body')[0];
	if (body && resource) {
		const stanzaIdReference = getTagElement(messageStanza, 'stanza-id');
		const stanzaId = optional?.stanzaId || (stanzaIdReference && getRequiredAttribute(stanzaIdReference, 'id') || messageId);
		const from = getId(resource);
		const messageTxt = Strophe.getText(body)
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');

		// Message is a reply to another message
		let replyTo;
		const threadElement = getTagElement(messageStanza, 'thread');
		if (threadElement != null) {
			replyTo = Strophe.getText(threadElement);
		}

		// Message is a forwarded message from another conversation
		let forwarded;
		const forwardedElement = messageStanza.getElementsByTagName('forwarded')[0];
		if (forwardedElement) {
			const forwardedMessageElement = getRequiredTagElement(forwardedElement, 'message');
			const delayElement = getRequiredTagElement(forwardedElement, 'delay');
			forwarded = {
				id: getRequiredAttribute(forwardedMessageElement, 'id'),
				date: dateToTimestamp(getRequiredAttribute(delayElement, 'stamp')),
				from: getId(getRequiredAttribute(forwardedMessageElement, 'from')),
				text: Strophe.getText(getRequiredTagElement(forwardedMessageElement, 'body'))
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
			forwarded
		};
		return message as TextMessage;
	}

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
		const from = getId(resource);
		const operation = Strophe.getText(getRequiredTagElement(x, 'operation'));
		const value =
			operation === 'roomPictureUpdated'
				? Strophe.getText(getRequiredTagElement(x, 'picture-name'))
				: operation === 'roomPictureDeleted'
				? ''
				: Strophe.getText(getRequiredTagElement(x, 'value'))
						.replace(/&amp;/g, '&')
						.replace(/&quot;/g, '"')
						.replace(/&apos;/g, "'")
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>');
		message = {
			id: messageId,
			roomId,
			date: messageDate,
			type: MessageType.CONFIGURATION_MSG,
			from,
			operation,
			value
		};
		return message as ConfigurationMessage;
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
