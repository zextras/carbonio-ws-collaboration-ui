/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export enum WsEventType {
	INITIALIZATION = 'websocketConnected',
	PONG = 'pong',
	ROOM_CREATED = 'ROOM_CREATED',
	ROOM_UPDATED = 'ROOM_UPDATED',
	ROOM_DELETED = 'ROOM_DELETED',
	ROOM_OWNER_PROMOTED = 'ROOM_OWNER_PROMOTED',
	ROOM_OWNER_DEMOTED = 'ROOM_OWNER_DEMOTED',
	ROOM_PICTURE_CHANGED = 'ROOM_PICTURE_CHANGED',
	ROOM_PICTURE_DELETED = 'ROOM_PICTURE_DELETED',
	ROOM_MEMBER_ADDED = 'ROOM_MEMBER_ADDED',
	ROOM_MEMBER_REMOVED = 'ROOM_MEMBER_REMOVED',
	ROOM_MUTED = 'ROOM_MUTED',
	ROOM_UNMUTED = 'ROOM_UNMUTED',
	USER_PICTURE_CHANGED = 'USER_PICTURE_CHANGED',
	USER_PICTURE_DELETED = 'USER_PICTURE_DELETED',
	ROOM_HISTORY_CLEARED = 'ROOM_HISTORY_CLEARED'
}

export type WsEvent =
	| PongEvent
	| RoomCreatedEvent
	| RoomUpdatedEvent
	| RoomDeletedEvent
	| RoomOwnerPromotedEvent
	| RoomOwnerDemotedEvent
	| RoomPictureChangedEvent
	| RoomPictureDeletedEvent
	| RoomMemberAddedEvent
	| RoomMemberRemovedEvent
	| RoomMutedEvent
	| RoomUnmutedEvent
	| UserPictureChangedEvent
	| UserPictureDeletedEvent
	| RoomHistoryClearedEvent
	| InitializationEvent;

export type InitializationEvent = {
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

export type RoomOwnerPromotedEvent = BasicEvent & {
	type: WsEventType.ROOM_OWNER_PROMOTED;
	roomId: string;
	userId: string;
};

export type RoomOwnerDemotedEvent = BasicEvent & {
	type: WsEventType.ROOM_OWNER_DEMOTED;
	roomId: string;
	userId: string;
};

export type RoomPictureChangedEvent = BasicEvent & {
	type: WsEventType.ROOM_PICTURE_CHANGED;
	roomId: string;
	updatedAt: string;
};

export type RoomPictureDeletedEvent = BasicEvent & {
	type: WsEventType.ROOM_PICTURE_DELETED;
	roomId: string;
};

export type RoomMemberAddedEvent = BasicEvent & {
	type: WsEventType.ROOM_MEMBER_ADDED;
	roomId: string;
	userId: string;
	isOwner: boolean;
};

export type RoomMemberRemovedEvent = BasicEvent & {
	type: WsEventType.ROOM_MEMBER_REMOVED;
	roomId: string;
	userId: string;
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
