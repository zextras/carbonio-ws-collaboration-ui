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

export type Message = TextMessage | AffiliationMessage | ConfigurationMessage | DateMessage;

export type BasicMessage = {
	id: string;
	roomId: string;
	date: number;
};

export type TextMessage = BasicMessage & {
	stanzaId: string;
	type: 'text';
	from: string;
	text: string;
	read: MarkerStatus;
	replyTo?: string;
	repliedMessage?: TextMessage;
};

export type AffiliationMessage = BasicMessage & {
	type: 'affiliation';
	userId: string;
	as: string;
};

export type ConfigurationMessage = BasicMessage & {
	type: 'configuration';
	operation:
		| 'roomNameChanged'
		| 'roomDescriptionChanged'
		| 'roomPictureUpdated'
		| 'roomPictureDeleted';
	value: string;
	from: string;
};

export type DateMessage = BasicMessage & {
	type: 'date';
};
