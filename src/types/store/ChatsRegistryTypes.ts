/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ChatsRegistryStoreSlice = {
	chatsRegistry: { [roomId: string]: ChatRegistry };
	newMessage: (message: Message) => void;
	newInboxMessage: (message: Message) => void;
	updateHistory: (roomId: string, messageArray: Message[]) => void;
	addCreateRoomMessage: (roomId: string) => void;
	updateReadStatus: (roomId: string, newMarkers: Marker[]) => void;
	setRepliedMessage: (
		roomId: string,
		replyMessageId: string,
		messageSubjectOfReply: TextMessage
	) => void;
	setPlaceholderMessage: (fields: PlaceholderFields) => void;
	removePlaceholderMessage: (roomId: string, messageId: string) => void;
	addFastening: (fasteningMessage: MessageFastening) => void;
	incrementUnreadCount: (roomId: string, counter: number) => void;
};

export type ChatRegistry = {
	messages: Message[];
	fastenings: { [stanzaId: string]: MessageFastening[] };
	markers: { [userId: string]: Marker };
	unread: number;
};

export type Message = TextMessage | ConfigurationMessage | DateMessage | MessageFastening;

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
	edited?: boolean;
	deleted?: boolean;
	replyTo?: string;
	repliedMessage?: TextMessage;
	forwarded?: ForwardedInfo;
	attachment?: AttachmentMessageType;
};

export type ConfigurationMessage = BasicMessage & {
	type: MessageType.CONFIGURATION_MSG;
	operation: OperationType;
	value: string;
	from: string;
	read: MarkerStatus;
};

export enum OperationType {
	ROOM_NAME_CHANGED = 'roomNameChanged',
	ROOM_DESCRIPTION_CHANGED = 'roomDescriptionChanged',
	ROOM_PICTURE_UPDATED = 'roomPictureUpdated',
	ROOM_PICTURE_DELETED = 'roomPictureDeleted',
	MEMBER_ADDED = 'memberAdded',
	MEMBER_REMOVED = 'memberRemoved',
	ROOM_CREATION = 'roomCreation'
}

export enum MarkerStatus {
	READ = 'read',
	READ_BY_SOMEONE = 'read_by_someone',
	UNREAD = 'unread',
	PENDING = 'pending'
}

export type DateMessage = BasicMessage & {
	type: MessageType.DATE_MSG;
};

export type MessageFastening = BasicMessage & {
	type: MessageType.FASTENING;
	action: FasteningAction;
	originalStanzaId: string;
	from: string;
	value?: string;
};

export enum FasteningAction {
	DELETE = 'delete',
	EDIT = 'edit',
	REACTION = 'reaction'
}

export enum MessageType {
	TEXT_MSG = 'text',
	CONFIGURATION_MSG = 'configuration',
	DATE_MSG = 'date',
	FASTENING = 'fastening'
}

export type ForwardedInfo = {
	id: string;
	date: number;
	from: string;
	count: number;
};

export type AttachmentMessageType = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	area?: string;
};

export type PlaceholderFields = {
	id: string;
	roomId: string;
	text: string;
	replyTo?: string;
	forwarded?: ForwardedInfo;
	attachment?: AttachmentMessageType;
};

export type Marker = {
	from: string;
	messageId: string;
	markerDate: number;
	type: 'displayed';
};
