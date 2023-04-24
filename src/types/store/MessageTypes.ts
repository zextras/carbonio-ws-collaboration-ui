/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MarkerStatus } from './MarkersTypes';

export type MessageMap = {
	[id: string]: MessageList;
};

export type MessageList = Message[];

export type Message =
	| TextMessage
	| DeletedMessage
	| AffiliationMessage
	| ConfigurationMessage
	| DateMessage
	| MessageFastening;

export type BasicMessage = {
	id: string;
	roomId: string;
	date: number;
};

export type TextMessage = BasicMessage & {
	stanzaId: string;
	type: MessageType.TEXT_MSG;
	from: string;
	text: string;
	read: MarkerStatus;
	replyTo?: string;
	repliedMessage?: TextMessage | DeletedMessage;
	edited?: boolean;
	forwarded?: ForwardedMessage;
	attachment?: AttachmentMessageType;
};

export type DeletedMessage = BasicMessage & {
	type: MessageType.DELETED_MSG;
	from: string;
};

export type AffiliationMessage = BasicMessage & {
	type: MessageType.AFFILIATION_MSG;
	userId: string;
	as: string;
};

export type ConfigurationMessage = BasicMessage & {
	type: MessageType.CONFIGURATION_MSG;
	operation:
		| 'roomNameChanged'
		| 'roomDescriptionChanged'
		| 'roomPictureUpdated'
		| 'roomPictureDeleted';
	value: string;
	from: string;
};

export type DateMessage = BasicMessage & {
	type: MessageType.DATE_MSG;
};

export enum MessageType {
	TEXT_MSG = 'text',
	DELETED_MSG = 'deleted',
	AFFILIATION_MSG = 'affiliation',
	CONFIGURATION_MSG = 'configuration',
	DATE_MSG = 'date',
	FASTENING = 'fastening'
}

export type ForwardedMessage = {
	id: string;
	date: number;
	from: string;
	text: string;
	attachment?: AttachmentMessageType;
};

export type AttachmentMessageType = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
};

export type MessageFastening = BasicMessage & {
	type: MessageType.FASTENING;
	action: 'delete' | 'edit';
	originalStanzaId: string;
	value?: string;
};
