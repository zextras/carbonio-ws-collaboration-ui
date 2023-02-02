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
	| DateMessage;

export type BasicMessage = {
	id: string;
	roomId: string;
	date: number;
};

export type TextMessage = BasicMessage & {
	type: MessageType.TEXT_MSG;
	from: string;
	text: string;
	read: MarkerStatus;
	replyTo?: string;
	repliedMessage?: TextMessage | DeletedMessage;
};

export type DeletedMessage = BasicMessage & {
	type: MessageType.DELETED_MSG;
	from: string;
};

export type AffiliationMessage = BasicMessage & {
	type: MessageType.AFFILIATION_MSG;
	userId: string;
	as: 'member';
};

export type ConfigurationMessage = BasicMessage & {
	type: MessageType.CONFIGURATION_MSG;
	operation: 'changedRoomName';
	value: string;
};

export type DateMessage = BasicMessage & {
	type: MessageType.DATE_MSG;
};

export enum MessageType {
	TEXT_MSG = 'text',
	DELETED_MSG = 'deleted',
	AFFILIATION_MSG = 'affiliation',
	CONFIGURATION_MSG = 'configuration',
	DATE_MSG = 'date'
}
