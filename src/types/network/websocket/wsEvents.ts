/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Attachment } from '../models/attachmentTypes';
import { MemberBe } from '../models/roomBeTypes';

export enum WsEventType {
	PONG = 'pong',
	ROOM_CREATED = 'roomCreated',
	ROOM_UPDATED = 'roomUpdated',
	ROOM_DELETED = 'roomDeleted',
	ROOM_OWNER_CHANGED = 'roomOwnerChanged',
	ROOM_PICTURE_CHANGED = 'roomPictureChanged',
	ROOM_PICTURE_DELETED = 'roomPictureDeleted',
	ROOM_MEMBER_ADDED = 'roomMemberAdded',
	ROOM_MEMBER_REMOVED = 'roomMemberRemoved',
	ATTACHMENT_ADDED = 'attachmentAdded',
	ATTACHMENT_REMOVED = 'attachmentRemoved',
	ROOM_MUTED = 'roomMuted',
	ROOM_UNMUTED = 'roomUnmuted',
	USER_PICTURE_CHANGED = 'userPictureChanged',
	USER_PICTURE_DELETED = 'userPictureDeleted',
	ROOM_HISTORY_CLEARED = 'roomHistoryCleared',
	INITIALIZATION = 'websocketConnected'
}

export type WsEvent =
	| PongEvent
	| RoomCreatedEvent
	| RoomUpdatedEvent
	| RoomDeletedEvent
	| RoomOwnerChangedEvent
	| RoomPictureChangedEvent
	| RoomPictureDeletedEvent
	| RoomMemberAddedEvent
	| RoomMemberRemovedEvent
	| AttachmentAddedEvent
	| AttachmentRemovedEvent
	| RoomMutedEvent
	| RoomUnmutedEvent
	| UserPictureChangedEvent
	| UserPictureDeletedEvent
	| RoomHistoryClearedEvent
	| InizializationEvent;

export type InizializationEvent = {
	type: WsEventType.INITIALIZATION;
	sessionId: string;
};

export type PongEvent = {
	type: WsEventType.PONG;
	sessionId: string;
};

type BasicEvent = {
	id: string;
	type: WsEventType;
	from: string;
	sentDate: string;
	sessionId: string;
};

export type RoomCreatedEvent = BasicEvent & {
	type: WsEventType.ROOM_CREATED;
	roomId: string;
};

export type RoomUpdatedEvent = BasicEvent & {
	type: WsEventType.ROOM_UPDATED;
	roomId: string;
	name: string;
	description: string;
};

export type RoomDeletedEvent = BasicEvent & {
	type: WsEventType.ROOM_DELETED;
	roomId: string;
};

export type RoomOwnerChangedEvent = BasicEvent & {
	type: WsEventType.ROOM_OWNER_CHANGED;
	roomId: string;
	userId: string;
	owner: boolean;
};

export type RoomPictureChangedEvent = BasicEvent & {
	type: WsEventType.ROOM_PICTURE_CHANGED;
	roomId: string;
};

export type RoomPictureDeletedEvent = BasicEvent & {
	type: WsEventType.ROOM_PICTURE_DELETED;
	roomId: string;
};

export type RoomMemberAddedEvent = BasicEvent & {
	type: WsEventType.ROOM_MEMBER_ADDED;
	roomId: string;
	member: MemberBe;
};

export type RoomMemberRemovedEvent = BasicEvent & {
	type: WsEventType.ROOM_MEMBER_REMOVED;
	roomId: string;
	userId: string;
};

export type AttachmentAddedEvent = BasicEvent & {
	type: WsEventType.ATTACHMENT_ADDED;
	roomId: string;
	attachment: Attachment;
};

export type AttachmentRemovedEvent = BasicEvent & {
	type: WsEventType.ATTACHMENT_REMOVED;
	roomId: string;
	fileId: string;
};

export type RoomMutedEvent = BasicEvent & {
	type: WsEventType.ROOM_MUTED;
	roomId: string;
};

export type RoomUnmutedEvent = BasicEvent & {
	type: WsEventType.ROOM_UNMUTED;
	roomId: string;
};

export type UserPictureChangedEvent = BasicEvent & {
	type: WsEventType.USER_PICTURE_CHANGED;
	userId: string;
};

export type UserPictureDeletedEvent = BasicEvent & {
	type: WsEventType.USER_PICTURE_DELETED;
	userId: string;
};

export type RoomHistoryClearedEvent = BasicEvent & {
	type: WsEventType.ROOM_HISTORY_CLEARED;
	roomId: string;
	clearedAt: string;
};
